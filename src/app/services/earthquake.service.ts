import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject, Subject } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Earthquake, EarthquakeStats } from '../models/earthquake.model';
import { AppStateService } from './app-state.service';
import { LoggerService } from './logger.service';
import { MOCK_EARTHQUAKES } from '../models/mock-data';
import { environment } from '../../environments/environment';

/**
 * Shape returned by QuakePulse_WebService /api/earthquake — uses flat
 * `location`, `latitude`, `longitude` fields and PascalCase-style metadata.
 * Adapted to the UI's `Earthquake` model by `toEarthquake()` below.
 */
interface BackendEarthquakeDto {
  id: string;
  magnitude: number;
  location: string;
  time: string;
  longitude: number;
  latitude: number;
  depth: number;
  status?: string;
  title?: string;
  url?: string;
}

interface BackendListResponse {
  metadata: {
    count: number;
    source: string;
    timestamp: string;
    cached: boolean;
  };
  data: BackendEarthquakeDto[];
}

@Injectable({ providedIn: 'root' })
export class EarthquakeService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private lastUpdatedSubject = new BehaviorSubject<Date | null>(null);
  private earthquakesSubject = new BehaviorSubject<Earthquake[]>([]);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private sourceSubject = new BehaviorSubject<string>('—');

  loading$ = this.loadingSubject.asObservable();
  lastUpdated$ = this.lastUpdatedSubject.asObservable();
  earthquakes$ = this.earthquakesSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  source$ = this.sourceSubject.asObservable();

  stats$: Observable<EarthquakeStats> = this.earthquakes$.pipe(
    map(data => ({
      total: data.length,
      highestMagnitude: data.length ? Math.max(...data.map(e => e.magnitude)) : 0,
      lastActivity: data.length
        ? data.reduce((a, b) => new Date(a.time) > new Date(b.time) ? a : b).time
        : null
    }))
  );

  private reload$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private state: AppStateService,
    private logger: LoggerService
  ) {
    // Filter changes trigger a reload. distinctUntilChanged needs a value
    // comparator: updateFilters() always emits a NEW object reference, so the
    // default reference check never dedupes and identical filters would
    // trigger redundant API calls.
    state.filters$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(
          (a, b) =>
            a.startDate === b.startDate &&
            a.endDate === b.endDate &&
            a.minMagnitude === b.minMagnitude &&
            a.maxMagnitude === b.maxMagnitude &&
            a.location === b.location
        )
      )
      .subscribe(() => this.reload$.next());

    // Single request pipeline. switchMap cancels any in-flight request when a
    // newer reload arrives, so a slow earlier response can never overwrite a
    // newer one (no out-of-order results).
    this.reload$
      .pipe(
        tap(() => {
          this.loadingSubject.next(true);
          this.errorSubject.next(null);
        }),
        switchMap(() => this.fetch())
      )
      .subscribe(({ source, events }) => {
        this.logger.logInfo(`Loaded ${events.length} earthquakes from ${source}`);
        this.sourceSubject.next(source);
        // Copy before sorting — never mutate the caller's array (notably the
        // shared MOCK_EARTHQUAKES constant on the fallback path).
        this.earthquakesSubject.next(
          [...events].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        );
        this.lastUpdatedSubject.next(new Date());
        this.loadingSubject.next(false);
      });

    this.reload$.next();
  }

  /** Trigger a (re)load of earthquake data for the current filters. */
  load(): void {
    this.reload$.next();
  }

  /**
   * Builds the request for the current filters. Always resolves (never errors)
   * so switchMap's outer subscription stays alive: failures fall back to mock.
   */
  private fetch(): Observable<{ source: string; events: Earthquake[] }> {
    const f = this.state.filters;

    if (!environment.apiBaseUrl) {
      console.warn('[EarthquakeService] No API base URL configured — using mock data');
      this.logger.logWarning('No API base URL configured — falling back to mock data');
      this.errorSubject.next('No API base URL configured');
      return of({ source: 'mock', events: MOCK_EARTHQUAKES });
    }

    let params = new HttpParams()
      .set('startDate', f.startDate)
      .set('endDate', f.endDate);

    if (f.minMagnitude > 0)  params = params.set('minMagnitude', f.minMagnitude.toString());
    if (f.maxMagnitude < 10) params = params.set('maxMagnitude', f.maxMagnitude.toString());
    if (f.location)          params = params.set('location', f.location);

    return this.http
      .get<BackendListResponse>(`${environment.apiBaseUrl}/api/Earthquake`, { params })
      .pipe(
        map(res => ({
          source: res.metadata?.source ?? 'usgs',
          events: (res.data ?? []).map(toEarthquake)
        })),
        catchError(err => {
          console.error('[EarthquakeService] API call failed — falling back to mock', err);
          this.logger.logError(
            `Earthquake API call failed (${err?.status ?? 'unknown'}): ${err?.message ?? 'failure'}`
          );
          this.errorSubject.next(
            err?.status === 0
              ? 'Cannot reach backend. Check that QuakePulse_WebService is running.'
              : `Backend error (${err?.status ?? 'unknown'}): ${err?.statusText ?? err?.message ?? 'failure'}`
          );
          return of({ source: 'mock', events: MOCK_EARTHQUAKES });
        })
      );
  }

  getById(id: string): Observable<Earthquake | undefined> {
    return this.earthquakes$.pipe(map(list => list.find(e => e.id === id)));
  }
}

/**
 * Adapter — converts the backend's flat DTO shape into the UI's
 * nested `Earthquake` model. Single point of contract reconciliation.
 */
function toEarthquake(dto: BackendEarthquakeDto): Earthquake {
  return {
    id: dto.id,
    magnitude: dto.magnitude,
    place: dto.location,
    time: dto.time,
    coordinates: {
      latitude:  dto.latitude,
      longitude: dto.longitude
    },
    depth: dto.depth,
    url: dto.url
  };
}

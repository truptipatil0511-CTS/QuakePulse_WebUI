import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import { map, catchError, switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Earthquake, EarthquakeFilters, EarthquakeListResponse, EarthquakeStats } from '../models/earthquake.model';
import { AppStateService } from './app-state.service';
import { MOCK_EARTHQUAKES } from '../models/mock-data';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EarthquakeService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private lastUpdatedSubject = new BehaviorSubject<Date | null>(null);
  private earthquakesSubject = new BehaviorSubject<Earthquake[]>([]);

  loading$ = this.loadingSubject.asObservable();
  lastUpdated$ = this.lastUpdatedSubject.asObservable();
  earthquakes$ = this.earthquakesSubject.asObservable();

  stats$: Observable<EarthquakeStats> = this.earthquakes$.pipe(
    map(data => ({
      total: data.length,
      highestMagnitude: data.length ? Math.max(...data.map(e => e.magnitude)) : 0,
      lastActivity: data.length ? data.reduce((a, b) => new Date(a.time) > new Date(b.time) ? a : b).time : null
    }))
  );

  constructor(private http: HttpClient, private state: AppStateService) {
    state.filters$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => this.load());
    this.load();
  }

  load(): void {
    this.loadingSubject.next(true);
    const f = this.state.filters;

    if (!environment.apiBaseUrl || environment.apiBaseUrl.includes('localhost')) {
      // Use mock data with client-side filtering when backend is not available
      setTimeout(() => {
        const filtered = MOCK_EARTHQUAKES.filter(e => {
          const inMag = e.magnitude >= f.minMagnitude && e.magnitude <= f.maxMagnitude;
          const start = new Date(f.startDate);
          const end = new Date(f.endDate);
          end.setHours(23, 59, 59);
          const t = new Date(e.time);
          const inDate = t >= start && t <= end;
          const inLoc = !f.location || e.place.toLowerCase().includes(f.location.toLowerCase());
          return inMag && inDate && inLoc;
        });
        this.earthquakesSubject.next(filtered.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
        this.lastUpdatedSubject.next(new Date());
        this.loadingSubject.next(false);
      }, 300);
      return;
    }

    let params = new HttpParams()
      .set('startDate', f.startDate)
      .set('endDate', f.endDate)
      .set('minMagnitude', f.minMagnitude.toString())
      .set('maxMagnitude', f.maxMagnitude.toString());
    if (f.location) params = params.set('location', f.location);

    this.http.get<EarthquakeListResponse>(`${environment.apiBaseUrl}/api/earthquake`, { params })
      .pipe(catchError(() => of({ data: MOCK_EARTHQUAKES, metadata: { count: MOCK_EARTHQUAKES.length, source: 'mock', timestamp: new Date().toISOString(), cached: false } })))
      .subscribe(res => {
        this.earthquakesSubject.next(res.data);
        this.lastUpdatedSubject.next(new Date());
        this.loadingSubject.next(false);
      });
  }

  getById(id: string): Observable<Earthquake | undefined> {
    return this.earthquakes$.pipe(map(list => list.find(e => e.id === id)));
  }
}

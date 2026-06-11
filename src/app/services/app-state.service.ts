import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Earthquake, EarthquakeFilters, ViewMode } from '../models/earthquake.model';

const today = new Date();
const sevenDaysAgo = new Date(today);
sevenDaysAgo.setDate(today.getDate() - 7);

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private viewModeSubject = new BehaviorSubject<ViewMode>('map');
  private filtersSubject = new BehaviorSubject<EarthquakeFilters>({
    startDate: toDateString(sevenDaysAgo),
    endDate: toDateString(today),
    minMagnitude: 0,
    maxMagnitude: 10,
    location: ''
  });
  private selectedSubject = new BehaviorSubject<Earthquake | null>(null);
  private zoomToSubject = new Subject<Earthquake>();
  private sidebarOpenSubject = new BehaviorSubject<boolean>(true);

  viewMode$ = this.viewModeSubject.asObservable();
  filters$ = this.filtersSubject.asObservable();
  selected$ = this.selectedSubject.asObservable();
  zoomTo$ = this.zoomToSubject.asObservable();
  sidebarOpen$ = this.sidebarOpenSubject.asObservable();

  get filters(): EarthquakeFilters { return this.filtersSubject.value; }
  get viewMode(): ViewMode { return this.viewModeSubject.value; }
  get sidebarOpen(): boolean { return this.sidebarOpenSubject.value; }

  setViewMode(mode: ViewMode): void { this.viewModeSubject.next(mode); }

  updateFilters(patch: Partial<EarthquakeFilters>): void {
    this.filtersSubject.next({ ...this.filtersSubject.value, ...patch });
  }

  selectEarthquake(eq: Earthquake | null): void { this.selectedSubject.next(eq); }

  zoomToEarthquake(eq: Earthquake): void {
    this.zoomToSubject.next(eq);
    this.setViewMode('map');
  }

  toggleSidebar(): void { this.sidebarOpenSubject.next(!this.sidebarOpenSubject.value); }
  setSidebarOpen(open: boolean): void { this.sidebarOpenSubject.next(open); }
}

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';
import { EarthquakeService } from '../../services/earthquake.service';
import { EarthquakeFilters, EarthquakeStats, ViewMode } from '../../models/earthquake.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  stats: EarthquakeStats = { total: 0, highestMagnitude: 0, lastActivity: null };
  viewMode: ViewMode = 'map';
  isOpen = true;
  private destroy$ = new Subject<void>();

  presets = [
    { label: '24h', days: 1 },
    { label: '7d', days: 7 },
    { label: '30d', days: 30 }
  ];

  constructor(
    private fb: FormBuilder,
    public stateService: AppStateService,
    public earthquakeService: EarthquakeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const f = this.stateService.filters;
    this.filterForm = this.fb.group({
      startDate: [f.startDate],
      endDate: [f.endDate],
      minMagnitude: [f.minMagnitude],
      maxMagnitude: [f.maxMagnitude],
      location: [f.location]
    });

    // No debounce here — EarthquakeService debounces filters$ centrally
    // (single debounce point). Patching state on each change is cheap; the
    // service collapses rapid changes and dedupes identical filter values.
    this.filterForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((val: EarthquakeFilters) => {
      const min = Math.min(val.minMagnitude, val.maxMagnitude);
      const max = Math.max(val.minMagnitude, val.maxMagnitude);
      this.stateService.updateFilters({ ...val, minMagnitude: min, maxMagnitude: max });
      // Under OnPush, reactive-form value changes do not mark this component
      // dirty, so the displayed filter values (minMag/maxMag labels, date
      // min/max constraints, badges) would render stale. Force a check.
      this.cdr.markForCheck();
    });

    // markForCheck() required under OnPush — these fields are assigned from
    // subscriptions, which OnPush does not pick up automatically.
    this.earthquakeService.stats$.pipe(takeUntil(this.destroy$))
      .subscribe(s => { this.stats = s; this.cdr.markForCheck(); });

    this.stateService.viewMode$.pipe(takeUntil(this.destroy$))
      .subscribe(v => { this.viewMode = v; this.cdr.markForCheck(); });

    this.stateService.sidebarOpen$.pipe(takeUntil(this.destroy$))
      .subscribe(open => { this.isOpen = open; this.cdr.markForCheck(); });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  setViewMode(mode: ViewMode): void { this.stateService.setViewMode(mode); }

  applyPreset(days: number): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    this.filterForm.patchValue({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  }

  resetFilters(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    this.filterForm.reset({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      minMagnitude: 0,
      maxMagnitude: 10,
      location: ''
    });
  }

  get minMag(): number { return this.filterForm.get('minMagnitude')?.value ?? 0; }
  get maxMag(): number { return this.filterForm.get('maxMagnitude')?.value ?? 10; }
}

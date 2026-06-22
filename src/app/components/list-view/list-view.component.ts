import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EarthquakeService } from '../../services/earthquake.service';
import { AppStateService } from '../../services/app-state.service';
import { Earthquake } from '../../models/earthquake.model';

type SortKey = 'time' | 'magnitude';

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListViewComponent implements OnInit, OnDestroy {
  earthquakes: Earthquake[] = [];
  sortKey: SortKey = 'time';
  selectedId: string | null = null;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    public earthquakeService: EarthquakeService,
    public stateService: AppStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // markForCheck() required under OnPush — these fields are assigned from
    // subscriptions, which OnPush does not pick up automatically.
    this.earthquakeService.earthquakes$.pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.earthquakes = this.sort(data, this.sortKey);
        this.cdr.markForCheck();
      });

    this.earthquakeService.loading$.pipe(takeUntil(this.destroy$))
      .subscribe(l => { this.loading = l; this.cdr.markForCheck(); });

    this.stateService.selected$.pipe(takeUntil(this.destroy$))
      .subscribe(eq => { this.selectedId = eq?.id ?? null; this.cdr.markForCheck(); });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  setSort(key: SortKey): void {
    this.sortKey = key;
    this.earthquakes = this.sort(this.earthquakes, key);
  }

  onItemClick(eq: Earthquake): void {
    this.stateService.zoomToEarthquake(eq);
    this.stateService.selectEarthquake(eq);
  }

  trackById(_: number, eq: Earthquake): string { return eq.id; }

  private sort(data: Earthquake[], key: SortKey): Earthquake[] {
    return [...data].sort((a, b) =>
      key === 'time'
        ? new Date(b.time).getTime() - new Date(a.time).getTime()
        : b.magnitude - a.magnitude
    );
  }
}

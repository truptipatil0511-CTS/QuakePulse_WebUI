import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EarthquakeService } from '../../services/earthquake.service';

@Component({
  selector: 'app-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.scss'],
  standalone: false
})
export class StatusBarComponent implements OnInit, OnDestroy {
  lastUpdated: Date | null = null;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(private earthquakeService: EarthquakeService) {}

  ngOnInit(): void {
    this.earthquakeService.lastUpdated$.pipe(takeUntil(this.destroy$))
      .subscribe(d => this.lastUpdated = d);
    this.earthquakeService.loading$.pipe(takeUntil(this.destroy$))
      .subscribe(l => this.loading = l);
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  refresh(): void { this.earthquakeService.load(); }

  get statusClass(): string {
    if (this.loading) return 'loading';
    if (!this.lastUpdated) return 'offline';
    const ageMs = Date.now() - this.lastUpdated.getTime();
    return ageMs > 5 * 60000 ? 'stale' : 'live';
  }
}

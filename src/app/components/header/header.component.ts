import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { AppStateService } from '../../services/app-state.service';
import { EarthquakeService } from '../../services/earthquake.service';
import { ThemeMode } from '../../models/earthquake.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  theme$!: Observable<ThemeMode>;
  loading$!: Observable<boolean>;
  locationQuery = '';

  constructor(
    public themeService: ThemeService,
    public stateService: AppStateService,
    public earthquakeService: EarthquakeService
  ) {}

  ngOnInit(): void {
    this.theme$ = this.themeService.theme$;
    this.loading$ = this.earthquakeService.loading$;
  }

  onLocationSearch(value: string): void {
    this.stateService.updateFilters({ location: value });
  }

  onRefresh(): void {
    this.earthquakeService.load();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleSidebar(): void {
    this.stateService.toggleSidebar();
  }
}

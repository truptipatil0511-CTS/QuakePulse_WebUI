import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { ThemeService } from './services/theme.service';
import { AppStateService } from './services/app-state.service';
import { LoggerService } from './services/logger.service';
import { ViewMode } from './models/earthquake.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  viewMode$!: Observable<ViewMode>;
  sidebarOpen$!: Observable<boolean>;

  constructor(
    private themeService: ThemeService,
    public stateService: AppStateService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.viewMode$ = this.stateService.viewMode$;
    this.sidebarOpen$ = this.stateService.sidebarOpen$;
    this.themeService.applyTheme(this.themeService.isDark ? 'dark' : 'light');
    this.logger.logInfo('QuakePulse UI initialized');
  }
}

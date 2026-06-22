import { TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';

import { App } from './app';
import { ThemeService } from './services/theme.service';
import { AppStateService } from './services/app-state.service';
import { ThemeMode, ViewMode } from './models/earthquake.model';

/**
 * Unit tests for the root App component.
 *
 * App is a thin shell: on init it exposes the state service's viewMode$ /
 * sidebarOpen$ streams to the template and applies the current theme. We test
 * exactly that — with the child components stubbed (NO_ERRORS_SCHEMA) and the
 * services mocked, so the tests are isolated, fast and deterministic.
 */
describe('App', () => {
  // Simple hand-rolled mocks (no test-runner spy API needed) ──────────
  let appliedTheme: ThemeMode | null;
  // Mutable mock — the real `isDark` is a read-only getter, so we model it as a
  // plain writable field here to flip it between tests.
  let themeServiceMock: { isDark: boolean; applyTheme: (theme: ThemeMode) => void };
  let stateServiceMock: Pick<AppStateService, 'viewMode$' | 'sidebarOpen$'>;

  beforeEach(async () => {
    appliedTheme = null;
    themeServiceMock = {
      isDark: false,
      applyTheme: (theme: ThemeMode) => { appliedTheme = theme; },
    };
    stateServiceMock = {
      viewMode$: of<ViewMode>('map'),
      sidebarOpen$: of(true),
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule], // for *ngIf + async pipe in the template
      declarations: [App],
      providers: [
        { provide: ThemeService, useValue: themeServiceMock },
        { provide: AppStateService, useValue: stateServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA], // ignore <app-header>, <app-map-view>, …
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes the state service streams on init', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges(); // triggers ngOnInit

    const app = fixture.componentInstance;
    expect(await firstValueFrom(app.viewMode$)).toBe('map');
    expect(await firstValueFrom(app.sidebarOpen$)).toBe(true);
  });

  it('applies the light theme on init when not dark', () => {
    themeServiceMock.isDark = false;

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(appliedTheme).toBe('light');
  });

  it('applies the dark theme on init when dark', () => {
    themeServiceMock.isDark = true;

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(appliedTheme).toBe('dark');
  });

  it('renders the app shell without errors', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.app-shell')).toBeTruthy();
  });
});

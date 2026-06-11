import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ThemeMode } from '../models/earthquake.model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'quakepulse-theme';

  private themeSubject = new BehaviorSubject<ThemeMode>(this.getSavedTheme());
  theme$ = this.themeSubject.asObservable();

  get isDark(): boolean {
    return this.themeSubject.value === 'dark';
  }

  toggle(): void {
    const next: ThemeMode = this.isDark ? 'light' : 'dark';
    this.themeSubject.next(next);
    localStorage.setItem(this.STORAGE_KEY, next);
    this.applyTheme(next);
  }

  applyTheme(theme: ThemeMode): void {
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
  }

  private getSavedTheme(): ThemeMode {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}

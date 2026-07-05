import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeSignal = signal<'light' | 'dark'>('light');
  readonly theme = this.themeSignal.asReadonly();
  private readonly key = 'billing_theme';

  constructor() {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(this.key) : null;
    const preferred = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';
    this.themeSignal.set(preferred);
    this.applyTheme(preferred);
  }

  toggle() {
    const next = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.themeSignal.set(next);
    localStorage.setItem(this.key, next);
    this.applyTheme(next);
  }

  private applyTheme(theme: 'light' | 'dark') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <!-- Mobile overlay -->
      @if (sidebarOpen()) {
        <div class="fixed inset-0 z-40 bg-black/50 lg:hidden" (click)="sidebarOpen.set(false)"></div>
      }

      <!-- Sidebar -->
      <aside
        class="fixed top-0 left-0 z-50 h-full w-60 bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 transition-transform duration-200"
        [class.-translate-x-full]="!sidebarOpen()"
        [class.translate-x-0]="sidebarOpen()"
        class:lg:translate-x-0="true"
      >
        <div class="flex items-center h-16 px-6 border-b border-secondary-200 dark:border-secondary-700">
          <h1 class="text-lg font-bold text-primary-600 dark:text-primary-400">Billing Portal</h1>
        </div>
        <nav class="p-4 space-y-1">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400"
              (click)="sidebarOpen.set(false)"
              class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700"
            >
              <span [innerHTML]="item.icon"></span>
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      <!-- Main content area -->
      <div class="lg:ml-60">
        <!-- Header -->
        <header class="fixed top-0 right-0 left-0 lg:left-60 h-16 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 z-30 flex items-center justify-between px-4 lg:px-6">
          <div class="flex items-center gap-4">
            <button (click)="sidebarOpen.set(!sidebarOpen())" class="lg:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-600 dark:text-secondary-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                @if (sidebarOpen()) {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                } @else {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
            <span class="text-sm text-secondary-500 dark:text-secondary-400 hidden sm:block">Subscription Billing</span>
          </div>

          <div class="flex items-center gap-3">
            <!-- Dark mode toggle -->
            <button
              (click)="themeService.toggle()"
              class="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-600 dark:text-secondary-400"
              title="Toggle dark mode"
            >
              @if (themeService.theme() === 'dark') {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              }
            </button>

            <!-- User menu -->
            <div class="relative" #menuContainer>
              <button
                (click)="userMenuOpen.set(!userMenuOpen())"
                class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300"
              >
                <div class="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                  {{ userNameInitial() }}
                </div>
                <span class="text-sm font-medium hidden sm:block">{{ authService.user()?.email }}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              @if (userMenuOpen()) {
                <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700 py-1 z-50">
                  <div class="px-4 py-2 border-b border-secondary-200 dark:border-secondary-700">
                    <p class="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">{{ authService.user()?.email }}</p>
                    <p class="text-xs text-secondary-500 dark:text-secondary-400">{{ authService.user()?.organizationName }}</p>
                  </div>
                  <button
                    (click)="logout()"
                    class="w-full text-left px-4 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                  >
                    Sign out
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Page content -->
        <main class="pt-16 p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MainLayout {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  protected readonly sidebarOpen = signal(false);
  protected readonly userMenuOpen = signal(false);

  protected readonly navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>' },
    { path: '/plans', label: 'Plans', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>' },
    { path: '/customers', label: 'Customers', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>' },
    { path: '/subscriptions', label: 'Subscriptions', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>' },
    { path: '/invoices', label: 'Invoices', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>' },
    { path: '/settings', label: 'Settings', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>' },
  ];

  protected userNameInitial() {
    const email = this.authService.user()?.email || 'U';
    return email.charAt(0).toUpperCase();
  }

  protected logout() {
    this.authService.logout();
    window.location.reload();
  }
}

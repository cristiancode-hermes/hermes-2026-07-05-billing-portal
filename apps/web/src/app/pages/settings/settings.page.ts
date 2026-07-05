import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { ErrorAlertComponent } from '../../shared/error-alert/error-alert.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule, ErrorAlertComponent],
  template: `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">Settings</h1>

      @if (loading()) {
        <div class="bg-white dark:bg-secondary-800 rounded-xl p-6 animate-pulse space-y-4">
          <div class="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/3"></div>
          <div class="h-10 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
          <div class="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/4"></div>
          <div class="h-10 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
        </div>
      } @else if (loadError()) {
        <app-error-alert [message]="loadError()" (retry)="loadSettings()" />
      } @else {
        <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          @if (saveError()) {
            <div class="mb-4 p-3 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg text-sm text-danger-600 dark:text-danger-400">{{ saveError() }}</div>
          }
          @if (successMessage()) {
            <div class="mb-4 p-3 bg-accent-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20 rounded-lg text-sm text-accent-600 dark:text-accent-500">{{ successMessage() }}</div>
          }
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Organization Name</label>
              <input type="text" [(ngModel)]="orgName" name="orgName" required class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="My Company" />
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Currency</label>
              <select [(ngModel)]="currency" name="currency" class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="BRL">BRL - Brazilian Real</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Default Tax Rate (%)</label>
              <input type="number" step="0.01" min="0" max="100" [(ngModel)]="defaultTaxRate" name="defaultTaxRate" class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="0" />
            </div>

            <div class="pt-4">
              <button type="submit" [disabled]="saving()" class="px-6 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2">
                @if (saving()) {
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Saving...
                } @else {
                  Save Settings
                }
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class SettingsPage {
  private readonly settingsService = inject(SettingsService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');
  protected readonly successMessage = signal('');

  protected readonly orgName = signal('');
  protected readonly currency = signal('USD');
  protected readonly defaultTaxRate = signal(0);

  constructor() {
    this.loadSettings();
  }

  protected loadSettings() {
    this.loading.set(true);
    this.loadError.set('');
    this.settingsService.get().subscribe({
      next: (settings) => {
        this.orgName.set(settings.name);
        this.currency.set(settings.currency || 'USD');
        this.defaultTaxRate.set(settings.defaultTaxRate || 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(err.error?.message || 'Failed to load settings');
        this.loading.set(false);
      },
    });
  }

  protected onSubmit() {
    if (!this.orgName()) return;
    this.saving.set(true);
    this.saveError.set('');
    this.successMessage.set('');
    this.settingsService.update({
      name: this.orgName(),
      currency: this.currency(),
      defaultTaxRate: this.defaultTaxRate(),
    }).subscribe({
      next: () => {
        this.successMessage.set('Settings saved successfully!');
        this.saving.set(false);
      },
      error: (err) => {
        this.saveError.set(err.error?.message || 'Failed to save settings');
        this.saving.set(false);
      },
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { ErrorAlertComponent } from '../../shared/error-alert/error-alert.component';

@Component({
  selector: 'app-customer-form-page',
  standalone: true,
  imports: [FormsModule, ErrorAlertComponent],
  template: `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">
        {{ isEdit() ? 'Edit Customer' : 'Add Customer' }}
      </h1>

      @if (loading()) {
        <div class="bg-white dark:bg-secondary-800 rounded-xl p-6 animate-pulse space-y-4">
          <div class="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/3"></div>
          <div class="h-10 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
          <div class="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/4"></div>
          <div class="h-10 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
        </div>
      } @else if (loadError()) {
        <app-error-alert [message]="loadError()" (retry)="loadCustomer()" />
      } @else {
        <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          @if (saveError()) {
            <div class="mb-4 p-3 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg text-sm text-danger-600 dark:text-danger-400">{{ saveError() }}</div>
          }
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Name</label>
              <input type="text" [(ngModel)]="name" name="name" required class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="John Doe" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Email</label>
              <input type="email" [(ngModel)]="email" name="email" required class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="john@example.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Phone</label>
              <input type="tel" [(ngModel)]="phone" name="phone" class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="+1 555-0123" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Company</label>
              <input type="text" [(ngModel)]="company" name="company" class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Acme Inc." />
            </div>
            <div class="flex gap-3 pt-4">
              <button type="submit" [disabled]="saving()" class="px-6 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2">
                @if (saving()) {
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Saving...
                } @else {
                  {{ isEdit() ? 'Update Customer' : 'Add Customer' }}
                }
              </button>
              <button type="button" (click)="goBack()" class="px-6 py-2.5 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded-lg transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class CustomerFormPage {
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly isEdit = signal(false);
  protected readonly customerId = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal('');
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly phone = signal('');
  protected readonly company = signal('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.customerId.set(id);
      this.loadCustomer();
    }
  }

  protected loadCustomer() {
    const id = this.customerId();
    if (!id) return;
    this.loading.set(true);
    this.customerService.getById(id).subscribe({
      next: (c) => {
        this.name.set(c.name);
        this.email.set(c.email);
        this.phone.set(c.phone || '');
        this.company.set(c.company || '');
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(err.error?.message || 'Failed to load customer');
        this.loading.set(false);
      },
    });
  }

  protected onSubmit() {
    if (!this.name() || !this.email()) return;
    this.saving.set(true);
    this.saveError.set('');
    const data = { name: this.name(), email: this.email(), phone: this.phone() || undefined, company: this.company() || undefined };
    const req = this.isEdit()
      ? this.customerService.update(this.customerId()!, data)
      : this.customerService.create(data);
    req.subscribe({
      next: () => this.router.navigate(['/customers']),
      error: (err) => {
        this.saveError.set(err.error?.message || 'Failed to save');
        this.saving.set(false);
      },
    });
  }

  protected goBack() { this.router.navigate(['/customers']); }
}

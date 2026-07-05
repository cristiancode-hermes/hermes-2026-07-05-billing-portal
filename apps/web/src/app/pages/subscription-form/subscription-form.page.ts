import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../services/subscription.service';
import { PlanService } from '../../services/plan.service';
import { CustomerService } from '../../services/customer.service';
import { Plan } from '../../models/plan.model';
import { Customer } from '../../models/customer.model';
import { ErrorAlertComponent } from '../../shared/error-alert/error-alert.component';
import { PriceDisplayComponent } from '../../shared/price-display/price-display.component';

@Component({
  selector: 'app-subscription-form-page',
  standalone: true,
  imports: [FormsModule, ErrorAlertComponent, PriceDisplayComponent],
  template: `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">New Subscription</h1>

      @if (loadingCustomers() || loadingPlans()) {
        <div class="bg-white dark:bg-secondary-800 rounded-xl p-6 animate-pulse space-y-4">
          <div class="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/3"></div>
          <div class="h-10 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
        </div>
      } @else if (loadError()) {
        <app-error-alert [message]="loadError()" (retry)="loadData()" />
      } @else {
        <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          @if (saveError()) {
            <div class="mb-4 p-3 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg text-sm text-danger-600 dark:text-danger-400">{{ saveError() }}</div>
          }
          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Customer -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Customer</label>
              <select [(ngModel)]="selectedCustomerId" name="customerId" required class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">Select a customer...</option>
                @for (c of customers(); track c.id) {
                  <option [value]="c.id">{{ c.name }} ({{ c.email }})</option>
                }
              </select>
            </div>

            <!-- Plan -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Plan</label>
              <div class="grid grid-cols-1 gap-3">
                @for (plan of plans(); track plan.id) {
                  <label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors"
                    [class]="selectedPlanId() === plan.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                      : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'"
                  >
                    <input type="radio" name="planId" [value]="plan.id" [(ngModel)]="selectedPlanId" class="mt-1 text-primary-500 focus:ring-primary-500" />
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-secondary-900 dark:text-secondary-100">{{ plan.name }}</span>
                        <app-price-display [price]="plan.price" />
                      </div>
                      <span class="text-xs text-secondary-500 dark:text-secondary-400 capitalize">{{ plan.cycle }}</span>
                      @if (plan.features?.length) {
                        <div class="mt-2 flex flex-wrap gap-1">
                          @for (feat of plan.features.slice(0, 3); track feat) {
                            <span class="inline-block px-2 py-0.5 text-xs bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 rounded-full">{{ feat }}</span>
                          }
                          @if (plan.features.length > 3) {
                            <span class="text-xs text-secondary-400">+{{ plan.features.length - 3 }} more</span>
                          }
                        </div>
                      }
                    </div>
                  </label>
                }
              </div>
            </div>

            <!-- Start Date -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Start Date</label>
              <input type="date" [(ngModel)]="startDate" name="startDate" required class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

            <div class="flex gap-3 pt-4">
              <button type="submit" [disabled]="saving()" class="px-6 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2">
                @if (saving()) {
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Creating...
                } @else {
                  Create Subscription
                }
              </button>
              <button type="button" (click)="router.navigate(['/subscriptions'])" class="px-6 py-2.5 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded-lg transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class SubscriptionFormPage {
  protected readonly subscriptionService = inject(SubscriptionService);
  protected readonly planService = inject(PlanService);
  protected readonly customerService = inject(CustomerService);
  protected readonly router = inject(Router);

  protected readonly loadingCustomers = signal(true);
  protected readonly loadingPlans = signal(true);
  protected readonly loadError = signal('');
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');

  protected readonly customers = signal<Customer[]>([]);
  protected readonly plans = signal<Plan[]>([]);
  protected readonly selectedCustomerId = signal('');
  protected readonly selectedPlanId = signal('');
  protected readonly startDate = signal('');

  constructor() {
    this.loadData();
  }

  protected loadData() {
    this.loadError.set('');
    this.customerService.getAll({}).subscribe({
      next: (res) => {
        this.customers.set(res.data);
        this.loadingCustomers.set(false);
      },
      error: (err) => {
        this.loadError.set(err.error?.message || 'Failed to load customers');
        this.loadingCustomers.set(false);
      },
    });
    this.planService.getAll().subscribe({
      next: (plans) => {
        this.plans.set(plans.filter((p) => p.isActive));
        this.loadingPlans.set(false);
      },
      error: (err) => {
        this.loadError.set(err.error?.message || 'Failed to load plans');
        this.loadingPlans.set(false);
      },
    });
  }

  protected onSubmit() {
    if (!this.selectedCustomerId() || !this.selectedPlanId() || !this.startDate()) return;
    this.saving.set(true);
    this.saveError.set('');
    this.subscriptionService.create({
      customerId: this.selectedCustomerId(),
      planId: this.selectedPlanId(),
      startDate: this.startDate(),
    }).subscribe({
      next: (sub) => this.router.navigate(['/subscriptions', sub.id]),
      error: (err) => {
        this.saveError.set(err.error?.message || 'Failed to create subscription');
        this.saving.set(false);
      },
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SubscriptionService } from '../../services/subscription.service';
import { Subscription } from '../../models/subscription.model';
import { Invoice } from '../../models/invoice.model';
import { InvoiceService } from '../../services/invoice.service';
import { ErrorAlertComponent } from '../../shared/error-alert/error-alert.component';
import { StatusPillComponent } from '../../shared/status-pill/status-pill.component';
import { PriceDisplayComponent } from '../../shared/price-display/price-display.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-subscription-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, ErrorAlertComponent, StatusPillComponent, PriceDisplayComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (error()) {
      <app-error-alert [message]="error()" (retry)="loadData()" />
    } @else if (!subscription()) {
      <app-error-alert message="Subscription not found" [showRetry]="false" />
    } @else {
      @let sub = subscription()!;
      <div class="mb-6">
        <a [routerLink]="['/subscriptions']" class="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block">&larr; Back to Subscriptions</a>
        <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Subscription Details</h1>
      </div>

      <!-- Info Card -->
      <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6 mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <p class="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">Plan</p>
            <p class="text-sm font-medium text-secondary-900 dark:text-secondary-100">{{ sub.plan?.name || 'Unknown' }}</p>
          </div>
          <div>
            <p class="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">Customer</p>
            <a [routerLink]="['/customers', sub.customerId]" class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">{{ sub.customer?.name || 'Unknown' }}</a>
          </div>
          <div>
            <p class="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">Status</p>
            <app-status-pill [status]="sub.status" />
          </div>
          <div>
            <p class="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">Price</p>
            <app-price-display [price]="sub.plan?.price || 0" />
            <span class="text-xs text-secondary-400">/{{ sub.plan?.cycle }}</span>
          </div>
          <div>
            <p class="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">Start Date</p>
            <p class="text-sm text-secondary-900 dark:text-secondary-100">{{ sub.startDate | date:'mediumDate' }}</p>
          </div>
          <div>
            <p class="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">End Date</p>
            <p class="text-sm text-secondary-900 dark:text-secondary-100">{{ (sub.endDate | date:'mediumDate') || '—' }}</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
          @if (sub.status === 'active') {
            <button (click)="cancelSubscription()" class="px-4 py-2 text-sm font-medium text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 hover:bg-danger-100 dark:hover:bg-danger-500/20 rounded-lg transition-colors">
              Cancel Subscription
            </button>
          }
          @if (sub.status === 'cancelled') {
            <button (click)="reactivateSubscription()" class="px-4 py-2 text-sm font-medium text-accent-600 dark:text-accent-500 bg-accent-50 dark:bg-accent-500/10 hover:bg-accent-100 dark:hover:bg-accent-500/20 rounded-lg transition-colors">
              Reactivate
            </button>
          }
        </div>
      </div>

      <!-- Invoice History -->
      <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm">
        <div class="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
          <h3 class="text-sm font-semibold text-secondary-900 dark:text-secondary-100">Invoice History</h3>
        </div>
        @if (invoices().length === 0) {
          <div class="p-6 text-center text-sm text-secondary-500 dark:text-secondary-400">No invoices yet</div>
        } @else {
          <table class="w-full">
            <thead>
              <tr class="border-b border-secondary-200 dark:border-secondary-700">
                <th class="text-left px-6 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">Invoice</th>
                <th class="text-left px-6 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                <th class="text-right px-6 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">Amount</th>
                <th class="text-right px-6 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-secondary-200 dark:divide-secondary-700">
              @for (inv of invoices(); track inv.id) {
                <tr class="hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                  <td class="px-6 py-3 text-sm font-medium">
                    <a [routerLink]="['/invoices', inv.id]" class="text-primary-600 dark:text-primary-400 hover:underline">{{ inv.invoiceNumber }}</a>
                  </td>
                  <td class="px-6 py-3 text-sm text-secondary-500 dark:text-secondary-400">{{ inv.issuedDate | date:'mediumDate' }}</td>
                  <td class="px-6 py-3 text-sm text-right tabular-nums font-semibold text-secondary-900 dark:text-secondary-100">\${{ inv.total.toFixed(2) }}</td>
                  <td class="px-6 py-3 text-right"><app-status-pill [status]="inv.status" /></td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }
  `,
})
export class SubscriptionDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly invoiceService = inject(InvoiceService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly subscription = signal<Subscription | null>(null);
  protected readonly invoices = signal<Invoice[]>([]);
  private readonly subscriptionId = signal('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.subscriptionId.set(id);
      this.loadData();
    }
  }

  protected loadData() {
    const id = this.subscriptionId();
    if (!id) return;
    this.loading.set(true);
    this.error.set('');
    this.subscriptionService.getById(id).subscribe({
      next: (sub) => {
        this.subscription.set(sub);
        this.subscriptionService.getInvoices(id).subscribe({
          next: (invs) => {
            this.invoices.set(invs);
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load subscription');
        this.loading.set(false);
      },
    });
  }

  protected cancelSubscription() {
    const id = this.subscriptionId();
    if (!id) return;
    this.subscriptionService.cancel(id).subscribe({
      next: (sub) => this.subscription.set(sub),
      error: (err) => this.error.set(err.error?.message || 'Failed to cancel'),
    });
  }

  protected reactivateSubscription() {
    const id = this.subscriptionId();
    if (!id) return;
    this.subscriptionService.reactivate(id).subscribe({
      next: (sub) => this.subscription.set(sub),
      error: (err) => this.error.set(err.error?.message || 'Failed to reactivate'),
    });
  }
}

import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CustomerService } from '../../services/customer.service';
import { SubscriptionService } from '../../services/subscription.service';
import { InvoiceService } from '../../services/invoice.service';
import { Customer } from '../../models/customer.model';
import { Subscription } from '../../models/subscription.model';
import { Invoice } from '../../models/invoice.model';
import { ErrorAlertComponent } from '../../shared/error-alert/error-alert.component';
import { StatusPillComponent } from '../../shared/status-pill/status-pill.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-customer-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, ErrorAlertComponent, StatusPillComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (error()) {
      <app-error-alert [message]="error()" (retry)="loadData()" />
    } @else if (!customer()) {
      <app-error-alert message="Customer not found" [showRetry]="false" />
    } @else {
      @let c = customer()!;
      <div class="mb-6">
        <a [routerLink]="['/customers']" class="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block">&larr; Back to Customers</a>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100">{{ c.name }}</h1>
          <a [routerLink]="['/customers', c.id, 'edit']" class="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-lg transition-colors">Edit</a>
        </div>
      </div>

      <!-- Info Card -->
      <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6 mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p class="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">Email</p>
            <p class="text-sm text-secondary-900 dark:text-secondary-100">{{ c.email }}</p>
          </div>
          <div>
            <p class="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">Phone</p>
            <p class="text-sm text-secondary-900 dark:text-secondary-100">{{ c.phone || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">Company</p>
            <p class="text-sm text-secondary-900 dark:text-secondary-100">{{ c.company || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">Status</p>
            <app-status-pill [status]="c.hasActiveSubscription ? 'active' : 'inactive'" />
          </div>
        </div>
      </div>

      <!-- Active Subscriptions -->
      <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm mb-6">
        <div class="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
          <h3 class="text-sm font-semibold text-secondary-900 dark:text-secondary-100">Active Subscriptions</h3>
        </div>
        @if (subscriptions().length === 0) {
          <div class="p-6 text-center text-sm text-secondary-500 dark:text-secondary-400">No subscriptions</div>
        } @else {
          <div class="divide-y divide-secondary-200 dark:divide-secondary-700">
            @for (sub of subscriptions(); track sub.id) {
              <div class="px-6 py-4 flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-secondary-900 dark:text-secondary-100">{{ sub.plan?.name || 'Unknown Plan' }}</p>
                  <p class="text-xs text-secondary-500 dark:text-secondary-400">Started {{ sub.startDate | date:'mediumDate' }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <app-status-pill [status]="sub.status" />
                  <a [routerLink]="['/subscriptions', sub.id]" class="text-xs text-primary-600 dark:text-primary-400 hover:underline">View</a>
                </div>
              </div>
            }
          </div>
        }
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
                  <td class="px-6 py-3 text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    <a [routerLink]="['/invoices', inv.id]" class="hover:text-primary-600 dark:hover:text-primary-400">{{ inv.invoiceNumber }}</a>
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
export class CustomerDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly customerService = inject(CustomerService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly invoiceService = inject(InvoiceService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly customer = signal<Customer | null>(null);
  protected readonly subscriptions = signal<Subscription[]>([]);
  protected readonly invoices = signal<Invoice[]>([]);
  private readonly customerId = signal('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customerId.set(id);
      this.loadData();
    }
  }

  protected loadData() {
    const id = this.customerId();
    if (!id) return;
    this.loading.set(true);
    this.error.set('');
    this.customerService.getById(id).subscribe({
      next: (c) => {
        this.customer.set(c);
        this.loadSubscriptionsAndInvoices();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load customer');
        this.loading.set(false);
      },
    });
  }

  private loadSubscriptionsAndInvoices() {
    const id = this.customerId();
    this.subscriptionService.getByCustomer(id).subscribe({
      next: (subs) => this.subscriptions.set(subs),
    });
    this.invoiceService.getByCustomer(id).subscribe({
      next: (invs) => {
        this.invoices.set(invs);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load invoices');
        this.loading.set(false);
      },
    });
  }
}

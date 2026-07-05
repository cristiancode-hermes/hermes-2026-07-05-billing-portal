import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SubscriptionService } from '../../services/subscription.service';
import { Subscription } from '../../models/subscription.model';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { TabFilterComponent } from '../../shared/tab-filter/tab-filter.component';
import { SkeletonTableComponent } from '../../shared/skeleton-table/skeleton-table.component';
import { ErrorAlertComponent } from '../../shared/error-alert/error-alert.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { StatusPillComponent } from '../../shared/status-pill/status-pill.component';
import { PriceDisplayComponent } from '../../shared/price-display/price-display.component';

@Component({
  selector: 'app-subscriptions-page',
  standalone: true,
  imports: [RouterLink, SearchBarComponent, PaginationComponent, TabFilterComponent, SkeletonTableComponent, ErrorAlertComponent, EmptyStateComponent, StatusPillComponent, PriceDisplayComponent],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Subscriptions</h1>
      <a routerLink="/subscriptions/new" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Subscription
      </a>
    </div>

    <div class="flex flex-col sm:flex-row gap-4 mb-4">
      <app-tab-filter
        [tabs]="statusTabs"
        [selected]="statusFilter()"
        (selectedChange)="onStatusFilter($event)"
      />
      <div class="sm:w-64">
        <app-search-bar [placeholder]="'Search subscriptions...'" (search)="onSearch($event)" />
      </div>
    </div>

    @if (loading()) {
      <app-skeleton-table [rows]="5" [columns]="4" />
    } @else if (error()) {
      <app-error-alert [message]="error()" (retry)="loadSubscriptions()" />
    } @else if (subscriptions().length === 0) {
      <app-empty-state
        title="No subscriptions found"
        message="Create a subscription to link a customer with a plan."
        ctaLabel="New Subscription"
        (cta)="router.navigate(['/subscriptions/new'])"
      />
    } @else {
      <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-secondary-200 dark:border-secondary-700">
              <th class="text-left px-6 py-3 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Customer</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Plan</th>
              <th class="text-right px-6 py-3 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Price</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Status</th>
              <th class="text-right px-6 py-3 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-secondary-200 dark:divide-secondary-700">
            @for (sub of subscriptions(); track sub.id) {
              <tr class="hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                <td class="px-6 py-4 text-sm font-medium text-secondary-900 dark:text-secondary-100">{{ sub.customer?.name || 'Unknown' }}</td>
                <td class="px-6 py-4 text-sm text-secondary-500 dark:text-secondary-400">{{ sub.plan?.name || 'Unknown Plan' }}</td>
                <td class="px-6 py-4 text-sm text-right">
                  <app-price-display [price]="sub.plan?.price || 0" />
                </td>
                <td class="px-6 py-4">
                  <app-status-pill [status]="sub.status" />
                </td>
                <td class="px-6 py-4 text-right">
                  <a [routerLink]="['/subscriptions', sub.id]" class="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-lg transition-colors">View</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [currentPage]="page()" [totalPages]="totalPages()" (pageChange)="onPageChange($event)" />
    }
  `,
})
export class SubscriptionsPage {
  protected readonly subscriptionService = inject(SubscriptionService);
  protected readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly subscriptions = signal<Subscription[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = signal(10);
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal('');

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));

  protected readonly statusTabs = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Expired', value: 'expired' },
    { label: 'Paused', value: 'paused' },
  ];

  constructor() {
    this.loadSubscriptions();
  }

  protected loadSubscriptions() {
    this.loading.set(true);
    this.error.set('');
    const params: any = { page: this.page(), limit: this.limit() };
    if (this.searchTerm()) params.search = this.searchTerm();
    if (this.statusFilter()) params.status = this.statusFilter();
    this.subscriptionService.getAll(params).subscribe({
      next: (res) => {
        this.subscriptions.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load subscriptions');
        this.loading.set(false);
      },
    });
  }

  protected onStatusFilter(status: string) {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadSubscriptions();
  }

  protected onSearch(term: string) {
    this.searchTerm.set(term);
    this.page.set(1);
    this.loadSubscriptions();
  }

  protected onPageChange(p: number) {
    this.page.set(p);
    this.loadSubscriptions();
  }
}

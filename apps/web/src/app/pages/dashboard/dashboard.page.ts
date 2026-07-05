import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DashboardService, DashboardData } from '../../services/dashboard.service';
import { InvoiceService } from '../../services/invoice.service';
import { SkeletonCardComponent } from '../../shared/skeleton-card/skeleton-card.component';
import { ErrorAlertComponent } from '../../shared/error-alert/error-alert.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { StatusPillComponent } from '../../shared/status-pill/status-pill.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [DatePipe, SkeletonCardComponent, ErrorAlertComponent, EmptyStateComponent, StatusPillComponent],
  template: `
    @if (loading()) {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        @for (_ of [1,2,3,4]; track $index) {
          <app-skeleton-card />
        }
      </div>
      <div class="bg-white dark:bg-secondary-800 rounded-xl p-6 animate-pulse">
        <div class="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-24 mb-4"></div>
        <div class="h-40 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
      </div>
    } @else if (error()) {
      <app-error-alert [message]="error()" (retry)="loadData()" />
    } @else if (isEmpty()) {
      <app-empty-state
        title="Welcome to Billing Portal!"
        message="Start by creating your first plan, adding customers, and setting up subscriptions."
        ctaLabel="Create Plan"
        (cta)="onCreatePlan()"
      />
    } @else {
      @if (data(); as d) {
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm">
            <p class="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Monthly Recurring Revenue</p>
            <p class="text-2xl font-bold text-secondary-900 dark:text-secondary-100 tabular-nums">\${{ d.mrr.toFixed(2) }}</p>
          </div>
          <div class="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm">
            <p class="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Active Subscriptions</p>
            <p class="text-2xl font-bold text-secondary-900 dark:text-secondary-100">{{ d.activeSubscriptions }}</p>
          </div>
          <div class="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm">
            <p class="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Total Revenue</p>
            <p class="text-2xl font-bold text-secondary-900 dark:text-secondary-100 tabular-nums">\${{ d.totalRevenue.toFixed(2) }}</p>
          </div>
          <div class="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm">
            <p class="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Churn Rate</p>
            <p class="text-2xl font-bold text-secondary-900 dark:text-secondary-100">{{ d.churnRate.toFixed(1) }}%</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Revenue Chart -->
          <div class="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm">
            <h3 class="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Revenue (12 months)</h3>
            <div class="h-48 flex items-end gap-2">
              @for (item of d.revenueByMonth; track item.month) {
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div
                    class="w-full bg-primary-500 rounded-t transition-all duration-500"
                    [style.height.%]="barHeight(item.revenue, maxRevenue())"
                    [title]="item.month + ': $' + item.revenue.toFixed(2)"
                  ></div>
                  <span class="text-xs text-secondary-500 dark:text-secondary-400 truncate w-full text-center">{{ item.month.slice(0, 3) }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Subscription Summary -->
          <div class="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm">
            <h3 class="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Subscription Summary</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-accent-500"></div>
                  <span class="text-sm text-secondary-700 dark:text-secondary-300">Active</span>
                </div>
                <span class="text-lg font-semibold text-secondary-900 dark:text-secondary-100">{{ d.subscriptionSummary.active }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-danger-500"></div>
                  <span class="text-sm text-secondary-700 dark:text-secondary-300">Cancelled</span>
                </div>
                <span class="text-lg font-semibold text-secondary-900 dark:text-secondary-100">{{ d.subscriptionSummary.cancelled }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Overdue Invoices -->
        <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm">
          <div class="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
            <h3 class="text-sm font-semibold text-secondary-900 dark:text-secondary-100">Overdue Invoices</h3>
          </div>
          @if (d.overdueInvoices.length === 0) {
            <div class="p-6 text-center text-sm text-secondary-500 dark:text-secondary-400">No overdue invoices</div>
          } @else {
            <div class="divide-y divide-secondary-200 dark:divide-secondary-700">
              @for (inv of d.overdueInvoices; track inv.id) {
                <div class="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-secondary-900 dark:text-secondary-100">{{ inv.invoiceNumber }}</p>
                    <p class="text-xs text-secondary-500 dark:text-secondary-400">{{ inv.customer?.name || 'Unknown' }} — Due {{ inv.dueDate | date:'mediumDate' }}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="tabular-nums font-semibold text-secondary-900 dark:text-secondary-100">\${{ inv.total.toFixed(2) }}</span>
                    <app-status-pill [status]="inv.status" />
                    <button
                      (click)="markPaid(inv.id)"
                      class="px-3 py-1.5 text-xs font-medium text-accent-600 dark:text-accent-500 bg-accent-50 dark:bg-accent-500/10 hover:bg-accent-100 dark:hover:bg-accent-500/20 rounded-lg transition-colors"
                    >
                      Mark Paid
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    }
  `,
})
export class DashboardPage {
  private readonly dashboardService = inject(DashboardService);
  private readonly invoiceService = inject(InvoiceService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly data = signal<DashboardData | null>(null);

  protected readonly isEmpty = computed(() => !this.data() && !this.loading() && !this.error());
  protected readonly maxRevenue = computed(() => {
    const d = this.data();
    if (!d || d.revenueByMonth.length === 0) return 1;
    return Math.max(...d.revenueByMonth.map((r) => r.revenue), 1);
  });

  constructor() {
    this.loadData();
  }

  protected loadData() {
    this.loading.set(true);
    this.error.set('');
    this.dashboardService.getData().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load dashboard');
        this.loading.set(false);
      },
    });
  }

  protected barHeight(revenue: number, max: number): number {
    return (revenue / max) * 100;
  }

  protected markPaid(id: string) {
    this.invoiceService.updateStatus(id, 'paid').subscribe({
      next: () => this.loadData(),
    });
  }

  protected onCreatePlan() {
    // handled by router link
  }
}

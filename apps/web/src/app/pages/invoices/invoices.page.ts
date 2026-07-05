import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice } from '../../models/invoice.model';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { TabFilterComponent } from '../../shared/tab-filter/tab-filter.component';
import { SkeletonTableComponent } from '../../shared/skeleton-table/skeleton-table.component';
import { ErrorAlertComponent } from '../../shared/error-alert/error-alert.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { StatusPillComponent } from '../../shared/status-pill/status-pill.component';

@Component({
  selector: 'app-invoices-page',
  standalone: true,
  imports: [RouterLink, DatePipe, SearchBarComponent, PaginationComponent, TabFilterComponent, SkeletonTableComponent, ErrorAlertComponent, EmptyStateComponent, StatusPillComponent],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Invoices</h1>
      <a routerLink="/invoices/new" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Invoice
      </a>
    </div>

    <div class="flex flex-col sm:flex-row gap-4 mb-4">
      <app-tab-filter
        [tabs]="statusTabs"
        [selected]="statusFilter()"
        (selectedChange)="onStatusFilter($event)"
      />
      <div class="sm:w-64">
        <app-search-bar [placeholder]="'Search invoices...'" (search)="onSearch($event)" />
      </div>
    </div>

    @if (loading()) {
      <app-skeleton-table [rows]="5" [columns]="5" />
    } @else if (error()) {
      <app-error-alert [message]="error()" (retry)="loadInvoices()" />
    } @else if (invoices().length === 0) {
      <app-empty-state
        title="No invoices yet"
        message="Create your first invoice to bill your customers."
        ctaLabel="Create Invoice"
        (cta)="router.navigate(['/invoices/new'])"
      />
    } @else {
      <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-secondary-200 dark:border-secondary-700">
              <th class="text-left px-6 py-3 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Invoice</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Customer</th>
              <th class="text-right px-6 py-3 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Amount</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Date</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Status</th>
              <th class="text-right px-6 py-3 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-secondary-200 dark:divide-secondary-700">
            @for (inv of invoices(); track inv.id) {
              <tr class="hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                <td class="px-6 py-4 text-sm font-medium text-secondary-900 dark:text-secondary-100">{{ inv.invoiceNumber }}</td>
                <td class="px-6 py-4 text-sm text-secondary-500 dark:text-secondary-400">{{ inv.customer?.name || 'Unknown' }}</td>
                <td class="px-6 py-4 text-sm text-right tabular-nums font-semibold text-secondary-900 dark:text-secondary-100">\${{ inv.total.toFixed(2) }}</td>
                <td class="px-6 py-4 text-sm text-secondary-500 dark:text-secondary-400">{{ inv.issuedDate | date:'mediumDate' }}</td>
                <td class="px-6 py-4"><app-status-pill [status]="inv.status" /></td>
                <td class="px-6 py-4 text-right">
                  <a [routerLink]="['/invoices', inv.id]" class="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-lg transition-colors">View</a>
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
export class InvoicesPage {
  protected readonly invoiceService = inject(InvoiceService);
  protected readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly invoices = signal<Invoice[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = signal(10);
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal('');

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));

  protected readonly statusTabs = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Sent', value: 'sent' },
    { label: 'Paid', value: 'paid' },
    { label: 'Overdue', value: 'overdue' },
  ];

  constructor() {
    this.loadInvoices();
  }

  protected loadInvoices() {
    this.loading.set(true);
    this.error.set('');
    const params: any = { page: this.page(), limit: this.limit() };
    if (this.searchTerm()) params.search = this.searchTerm();
    if (this.statusFilter()) params.status = this.statusFilter();
    this.invoiceService.getAll(params).subscribe({
      next: (res) => {
        this.invoices.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load invoices');
        this.loading.set(false);
      },
    });
  }

  protected onStatusFilter(status: string) {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadInvoices();
  }

  protected onSearch(term: string) {
    this.searchTerm.set(term);
    this.page.set(1);
    this.loadInvoices();
  }

  protected onPageChange(p: number) {
    this.page.set(p);
    this.loadInvoices();
  }
}

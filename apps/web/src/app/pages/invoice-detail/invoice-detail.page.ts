import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice } from '../../models/invoice.model';
import { ErrorAlertComponent } from '../../shared/error-alert/error-alert.component';
import { StatusPillComponent } from '../../shared/status-pill/status-pill.component';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-invoice-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, ErrorAlertComponent, StatusPillComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (error()) {
      <app-error-alert [message]="error()" (retry)="loadData()" />
    } @else if (!invoice()) {
      <app-error-alert message="Invoice not found" [showRetry]="false" />
    } @else {
      @let inv = invoice()!;
      <div class="mb-6">
        <a [routerLink]="['/invoices']" class="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block">&larr; Back to Invoices</a>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100">{{ inv.invoiceNumber }}</h1>
            <p class="text-sm text-secondary-500 dark:text-secondary-400">Issued {{ inv.issuedDate | date:'mediumDate' }}</p>
          </div>
          <app-status-pill [status]="inv.status" />
        </div>
      </div>

      <!-- A4 Paper Style Invoice -->
      <div class="max-w-3xl mx-auto bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-8 mb-6">
        <!-- Header -->
        <div class="flex justify-between items-start mb-8">
          <div>
            <h2 class="text-xl font-bold text-secondary-900 dark:text-secondary-100">INVOICE</h2>
            <p class="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{{ inv.invoiceNumber }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-secondary-900 dark:text-secondary-100">Your Company</p>
            <p class="text-xs text-secondary-500 dark:text-secondary-400">Subscription Billing</p>
          </div>
        </div>

        <div class="border-t border-b border-secondary-200 dark:border-secondary-700 py-4 mb-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">Bill To</p>
              <p class="text-sm font-medium text-secondary-900 dark:text-secondary-100">{{ inv.customer?.name || 'Unknown' }}</p>
              <p class="text-sm text-secondary-500 dark:text-secondary-400">{{ inv.customer?.email }}</p>
              @if (inv.customer?.company) {
                <p class="text-sm text-secondary-500 dark:text-secondary-400">{{ inv.customer?.company }}</p>
              }
            </div>
            <div class="text-right">
              <p class="text-xs text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">Due Date</p>
              <p class="text-sm font-medium text-secondary-900 dark:text-secondary-100">{{ inv.dueDate | date:'mediumDate' }}</p>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        @if (inv.items && inv.items.length > 0) {
          <table class="w-full mb-6">
            <thead>
              <tr class="border-b border-secondary-200 dark:border-secondary-700">
                <th class="text-left pb-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">Description</th>
                <th class="text-right pb-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">Qty</th>
                <th class="text-right pb-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">Unit Price</th>
                <th class="text-right pb-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-secondary-200 dark:divide-secondary-700">
              @for (item of inv.items; track item.id || $index) {
                <tr>
                  <td class="py-3 text-sm text-secondary-900 dark:text-secondary-100">{{ item.description }}</td>
                  <td class="py-3 text-sm text-right text-secondary-700 dark:text-secondary-300">{{ item.quantity }}</td>
                  <td class="py-3 text-sm text-right tabular-nums text-secondary-700 dark:text-secondary-300">\${{ item.unitPrice.toFixed(2) }}</td>
                  <td class="py-3 text-sm text-right tabular-nums font-semibold text-secondary-900 dark:text-secondary-100">\${{ item.total.toFixed(2) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }

        <!-- Totals -->
        <div class="flex justify-end border-t border-secondary-200 dark:border-secondary-700 pt-4">
          <div class="w-64 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-secondary-600 dark:text-secondary-400">Subtotal</span>
              <span class="tabular-nums text-secondary-900 dark:text-secondary-100">\${{ inv.subtotal.toFixed(2) }}</span>
            </div>
            @if (inv.taxRate > 0) {
              <div class="flex justify-between text-sm">
                <span class="text-secondary-600 dark:text-secondary-400">Tax ({{ inv.taxRate }}%)</span>
                <span class="tabular-nums text-secondary-900 dark:text-secondary-100">\${{ inv.taxAmount.toFixed(2) }}</span>
              </div>
            }
            <div class="flex justify-between text-base font-bold border-t border-secondary-200 dark:border-secondary-700 pt-2">
              <span class="text-secondary-900 dark:text-secondary-100">Total</span>
              <span class="tabular-nums text-secondary-900 dark:text-secondary-100">\${{ inv.total.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-3 mb-6">
        @if (inv.status === 'draft') {
          <button (click)="sendInvoice()" class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">Send Invoice</button>
          <button (click)="cancelInvoice()" class="px-4 py-2 text-sm font-medium text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 hover:bg-danger-100 dark:hover:bg-danger-500/20 rounded-lg transition-colors">Cancel / Void</button>
        }
        @if (inv.status === 'sent' || inv.status === 'overdue') {
          <button (click)="showPaymentModal.set(true)" class="px-4 py-2 text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 rounded-lg transition-colors">Register Payment</button>
          <button (click)="cancelInvoice()" class="px-4 py-2 text-sm font-medium text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 hover:bg-danger-100 dark:hover:bg-danger-500/20 rounded-lg transition-colors">Cancel / Void</button>
        }
      </div>

      <!-- Payment Modal -->
      @if (showPaymentModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" (click)="showPaymentModal.set(false)"></div>
          <div class="relative bg-white dark:bg-secondary-800 rounded-xl shadow-2xl p-6 w-full max-w-md z-10">
            <h3 class="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Register Payment</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Payment Method</label>
                <select [(ngModel)]="paymentMethod" name="method" class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="transfer">Bank Transfer</option>
                  <option value="card">Credit Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Payment Date</label>
                <input type="date" [(ngModel)]="paymentDate" name="date" class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Reference (optional)</label>
                <input type="text" [(ngModel)]="paymentReference" name="reference" class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Transaction ID" />
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button (click)="showPaymentModal.set(false)" class="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 rounded-lg">Cancel</button>
              <button (click)="registerPayment()" [disabled]="paymentSaving()" class="px-4 py-2 text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 disabled:opacity-50 rounded-lg flex items-center gap-2">
                @if (paymentSaving()) {
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Processing...
                } @else {
                  Register Payment
                }
              </button>
            </div>
          </div>
        </div>
      }
    }
  `,
})
export class InvoiceDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly invoiceService = inject(InvoiceService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly invoice = signal<Invoice | null>(null);
  protected readonly showPaymentModal = signal(false);
  protected readonly paymentSaving = signal(false);
  protected readonly paymentMethod = signal('transfer');
  protected readonly paymentDate = signal(new Date().toISOString().split('T')[0]);
  protected readonly paymentReference = signal('');
  private readonly invoiceId = signal('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.invoiceId.set(id);
      this.loadData();
    }
  }

  protected loadData() {
    const id = this.invoiceId();
    if (!id) return;
    this.loading.set(true);
    this.error.set('');
    this.invoiceService.getById(id).subscribe({
      next: (inv) => {
        this.invoice.set(inv);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load invoice');
        this.loading.set(false);
      },
    });
  }

  protected sendInvoice() {
    this.invoiceService.send(this.invoiceId()).subscribe({
      next: (inv) => this.invoice.set(inv),
      error: (err) => this.error.set(err.error?.message || 'Failed to send invoice'),
    });
  }

  protected cancelInvoice() {
    this.invoiceService.updateStatus(this.invoiceId(), 'cancelled').subscribe({
      next: (inv) => this.invoice.set(inv),
      error: (err) => this.error.set(err.error?.message || 'Failed to cancel invoice'),
    });
  }

  protected registerPayment() {
    this.paymentSaving.set(true);
    this.invoiceService.registerPayment(this.invoiceId(), {
      method: this.paymentMethod() as any,
      date: this.paymentDate(),
      reference: this.paymentReference() || undefined,
    }).subscribe({
      next: () => {
        this.showPaymentModal.set(false);
        this.paymentSaving.set(false);
        this.loadData();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to register payment');
        this.paymentSaving.set(false);
      },
    });
  }
}

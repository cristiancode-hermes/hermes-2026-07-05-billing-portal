import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';
import { InvoiceItem } from '../../models/invoice-item.model';
import { ErrorAlertComponent } from '../../shared/error-alert/error-alert.component';

@Component({
  selector: 'app-invoice-wizard-page',
  standalone: true,
  imports: [FormsModule, ErrorAlertComponent],
  template: `
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">Create Invoice</h1>

      <!-- Step Indicator -->
      <div class="flex items-center justify-center gap-2 mb-8">
        @for (step of steps; track step.number) {
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
              [class]="step.number === currentStep()
                ? 'bg-primary-500 text-white'
                : step.number < currentStep()
                  ? 'bg-accent-500 text-white'
                  : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-500 dark:text-secondary-400'"
            >
              @if (step.number < currentStep()) {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              } @else {
                {{ step.number }}
              }
            </div>
            <span class="text-sm text-secondary-600 dark:text-secondary-400 hidden sm:inline">{{ step.label }}</span>
            @if (step.number < 4) {
              <div class="w-8 h-0.5 mx-1 bg-secondary-200 dark:bg-secondary-700"></div>
            }
          </div>
        }
      </div>

      @if (loadError()) {
        <app-error-alert [message]="loadError()" (retry)="loadCustomers()" />
      } @else {
        <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          @if (saveError()) {
            <div class="mb-4 p-3 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg text-sm text-danger-600 dark:text-danger-400">{{ saveError() }}</div>
          }

          <!-- Step 1: Customer -->
          @if (currentStep() === 1) {
            <div>
              <h2 class="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Select Customer</h2>
              <select [(ngModel)]="selectedCustomerId" name="customerId" required class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Choose a customer...</option>
                @for (c of customers(); track c.id) {
                  <option [value]="c.id">{{ c.name }} ({{ c.email }})</option>
                }
              </select>
            </div>
          }

          <!-- Step 2: Line Items -->
          @if (currentStep() === 2) {
            <div>
              <h2 class="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Line Items</h2>
              @for (item of items(); track $index; let i = $index) {
                <div class="flex gap-2 items-start mb-3 p-3 bg-secondary-50 dark:bg-secondary-700/30 rounded-lg">
                  <div class="flex-1">
                    <input type="text" placeholder="Description" [(ngModel)]="item.description" [name]="'desc_' + i" class="w-full px-3 py-2 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-1" />
                  </div>
                  <div class="w-20">
                    <input type="number" min="1" placeholder="Qty" [(ngModel)]="item.quantity" [name]="'qty_' + i" class="w-full px-3 py-2 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div class="w-28">
                    <div class="relative">
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-secondary-400 text-sm">\$</span>
                      <input type="number" step="0.01" min="0" placeholder="0.00" [(ngModel)]="item.unitPrice" [name]="'price_' + i" (input)="recalcItem(i)" class="w-full pl-6 pr-3 py-2 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                  <div class="w-24 pt-2 text-right tabular-nums text-sm font-medium text-secondary-900 dark:text-secondary-100">\${{ item.total.toFixed(2) }}</div>
                  <button (click)="removeItem(i)" class="p-2 text-danger-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-lg transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              }
              <button (click)="addItem()" class="mt-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-lg transition-colors">
                + Add Item
              </button>
              <div class="mt-4 text-right">
                <p class="text-sm text-secondary-500 dark:text-secondary-400">Subtotal: <span class="tabular-nums font-semibold text-secondary-900 dark:text-secondary-100">\${{ subtotal().toFixed(2) }}</span></p>
              </div>
            </div>
          }

          <!-- Step 3: Preview -->
          @if (currentStep() === 3) {
            <div>
              <h2 class="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Preview Invoice</h2>

              <div class="border border-secondary-200 dark:border-secondary-700 rounded-lg p-6 mb-4">
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 class="font-bold text-secondary-900 dark:text-secondary-100">INVOICE</h3>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-medium text-secondary-900 dark:text-secondary-100">Your Company</p>
                  </div>
                </div>

                <div class="border-t border-b border-secondary-200 dark:border-secondary-700 py-3 mb-4">
                  <p class="text-xs text-secondary-500 uppercase mb-1">Bill To</p>
                  <p class="text-sm font-medium text-secondary-900 dark:text-secondary-100">{{ selectedCustomerName() }}</p>
                </div>

                <table class="w-full mb-4">
                  <thead>
                    <tr class="border-b border-secondary-200 dark:border-secondary-700">
                      <th class="text-left pb-2 text-xs text-secondary-500 uppercase">Description</th>
                      <th class="text-right pb-2 text-xs text-secondary-500 uppercase">Qty</th>
                      <th class="text-right pb-2 text-xs text-secondary-500 uppercase">Price</th>
                      <th class="text-right pb-2 text-xs text-secondary-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-secondary-200 dark:divide-secondary-700">
                    @for (item of items(); track $index) {
                      <tr>
                        <td class="py-2 text-sm text-secondary-900 dark:text-secondary-100">{{ item.description }}</td>
                        <td class="py-2 text-sm text-right text-secondary-700">{{ item.quantity }}</td>
                        <td class="py-2 text-sm text-right tabular-nums text-secondary-700">\${{ item.unitPrice.toFixed(2) }}</td>
                        <td class="py-2 text-sm text-right tabular-nums font-semibold text-secondary-900 dark:text-secondary-100">\${{ item.total.toFixed(2) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>

                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-sm text-secondary-600 dark:text-secondary-400">Tax Rate (%)</label>
                    <input type="number" step="0.01" min="0" max="100" [(ngModel)]="taxRate" name="taxRate" class="w-24 px-3 py-1.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 text-right focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div class="flex justify-end border-t border-secondary-200 dark:border-secondary-700 pt-3">
                    <div class="w-56 space-y-1">
                      <div class="flex justify-between text-sm">
                        <span class="text-secondary-600">Subtotal</span>
                        <span class="tabular-nums">\${{ subtotal().toFixed(2) }}</span>
                      </div>
                      @if (taxRate() > 0) {
                        <div class="flex justify-between text-sm">
                          <span class="text-secondary-600">Tax ({{ taxRate() }}%)</span>
                          <span class="tabular-nums">\${{ taxAmount().toFixed(2) }}</span>
                        </div>
                      }
                      <div class="flex justify-between text-base font-bold border-t border-secondary-200 dark:border-secondary-700 pt-2">
                        <span>Total</span>
                        <span class="tabular-nums">\${{ total().toFixed(2) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Due Date</label>
                <input type="date" [(ngModel)]="dueDate" name="dueDate" required class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          }

          <!-- Step 4: Confirm -->
          @if (currentStep() === 4) {
            <div class="text-center py-8">
              <div class="w-16 h-16 mx-auto mb-4 text-accent-500">
                <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">Ready to Create</h2>
              <p class="text-secondary-500 dark:text-secondary-400 mb-2">Invoice for <strong>{{ selectedCustomerName() }}</strong></p>
              <p class="text-3xl font-bold text-secondary-900 dark:text-secondary-100 tabular-nums">\${{ total().toFixed(2) }}</p>
            </div>
          }

          <!-- Navigation -->
          <div class="flex justify-between mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-700">
            <div>
              @if (currentStep() > 1) {
                <button (click)="prevStep()" class="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded-lg transition-colors">
                  Back
                </button>
              }
            </div>
            <div>
              @if (currentStep() < 4) {
                <button (click)="nextStep()" [disabled]="!canProceed()" class="px-6 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors">
                  Next
                </button>
              } @else {
                <button (click)="onConfirm()" [disabled]="saving()" class="px-6 py-2 text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2">
                  @if (saving()) {
                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Creating...
                  } @else {
                    Create Invoice
                  }
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class InvoiceWizardPage {
  private readonly invoiceService = inject(InvoiceService);
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);

  protected readonly currentStep = signal(1);
  protected readonly loadError = signal('');
  protected readonly saveError = signal('');
  protected readonly saving = signal(false);

  protected readonly customers = signal<Customer[]>([]);
  protected readonly selectedCustomerId = signal('');
  protected readonly items = signal<InvoiceItem[]>([{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  protected readonly taxRate = signal(0);
  protected readonly dueDate = signal(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);

  protected readonly selectedCustomerName = computed(() => {
    const c = this.customers().find((c) => c.id === this.selectedCustomerId());
    return c?.name || 'Unknown';
  });

  protected readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.total, 0)
  );

  protected readonly taxAmount = computed(() =>
    this.subtotal() * (this.taxRate() / 100)
  );

  protected readonly total = computed(() =>
    this.subtotal() + this.taxAmount()
  );

  protected readonly steps = [
    { number: 1, label: 'Customer' },
    { number: 2, label: 'Items' },
    { number: 3, label: 'Preview' },
    { number: 4, label: 'Confirm' },
  ];

  constructor() {
    this.loadCustomers();
  }

  protected loadCustomers() {
    this.customerService.getAll({}).subscribe({
      next: (res) => this.customers.set(res.data),
      error: (err) => this.loadError.set(err.error?.message || 'Failed to load customers'),
    });
  }

  protected canProceed(): boolean {
    switch (this.currentStep()) {
      case 1: return !!this.selectedCustomerId();
      case 2: return this.items().every((i) => i.description && i.quantity > 0 && i.unitPrice >= 0);
      case 3: return !!this.dueDate();
      default: return true;
    }
  }

  protected nextStep() {
    if (this.canProceed() && this.currentStep() < 4) {
      this.currentStep.update((s) => s + 1);
    }
  }

  protected prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  protected addItem() {
    this.items.update((items) => [...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  }

  protected removeItem(index: number) {
    this.items.update((items) => items.filter((_, i) => i !== index));
  }

  protected recalcItem(index: number) {
    this.items.update((items) => {
      const item = items[index];
      item.total = item.quantity * item.unitPrice;
      return [...items];
    });
  }

  protected onConfirm() {
    this.saving.set(true);
    this.saveError.set('');
    this.invoiceService.create({
      customerId: this.selectedCustomerId(),
      items: this.items().map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
      taxRate: this.taxRate(),
      dueDate: this.dueDate(),
    }).subscribe({
      next: (inv) => this.router.navigate(['/invoices', inv.id]),
      error: (err) => {
        this.saveError.set(err.error?.message || 'Failed to create invoice');
        this.saving.set(false);
      },
    });
  }
}

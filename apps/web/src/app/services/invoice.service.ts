import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Invoice } from '../models/invoice.model';
import { PaymentFormData, Payment } from '../models/payment.model';

const apiUrl = '/api';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly http = inject(HttpClient);

  getAll(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    return this.http.get<{ data: Invoice[]; total: number; page: number; limit: number }>(`${apiUrl}/invoices`, { params: params as any });
  }

  getById(id: string) {
    return this.http.get<Invoice>(`${apiUrl}/invoices/${id}`);
  }

  create(data: { customerId: string; items: { description: string; quantity: number; unitPrice: number }[]; taxRate: number; dueDate: string }) {
    return this.http.post<Invoice>(`${apiUrl}/invoices`, data);
  }

  updateStatus(id: string, status: string) {
    return this.http.patch<Invoice>(`${apiUrl}/invoices/${id}/status`, { status });
  }

  registerPayment(invoiceId: string, data: PaymentFormData) {
    return this.http.post<Payment>(`${apiUrl}/invoices/${invoiceId}/payments`, data);
  }

  send(id: string) {
    return this.http.post<Invoice>(`${apiUrl}/invoices/${id}/send`, {});
  }

  getByCustomer(customerId: string) {
    return this.http.get<Invoice[]>(`${apiUrl}/customers/${customerId}/invoices`);
  }
}

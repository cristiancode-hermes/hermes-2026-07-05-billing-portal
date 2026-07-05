import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, SubscriptionFormData } from '../models/subscription.model';
import { Invoice } from '../models/invoice.model';

const apiUrl = '/api';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);

  getAll(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    return this.http.get<{ data: Subscription[]; total: number; page: number; limit: number }>(`${apiUrl}/subscriptions`, { params: params as any });
  }

  getById(id: string) {
    return this.http.get<Subscription>(`${apiUrl}/subscriptions/${id}`);
  }

  create(data: SubscriptionFormData) {
    return this.http.post<Subscription>(`${apiUrl}/subscriptions`, data);
  }

  cancel(id: string) {
    return this.http.post<Subscription>(`${apiUrl}/subscriptions/${id}/cancel`, {});
  }

  reactivate(id: string) {
    return this.http.post<Subscription>(`${apiUrl}/subscriptions/${id}/reactivate`, {});
  }

  changePlan(id: string, planId: string) {
    return this.http.post<Subscription>(`${apiUrl}/subscriptions/${id}/change-plan`, { planId });
  }

  getInvoices(subscriptionId: string) {
    return this.http.get<Invoice[]>(`${apiUrl}/subscriptions/${subscriptionId}/invoices`);
  }

  getByCustomer(customerId: string) {
    return this.http.get<Subscription[]>(`${apiUrl}/customers/${customerId}/subscriptions`);
  }
}

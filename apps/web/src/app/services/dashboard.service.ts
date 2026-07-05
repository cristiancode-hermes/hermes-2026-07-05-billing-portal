import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const apiUrl = '/api';

export interface DashboardData {
  mrr: number;
  activeSubscriptions: number;
  totalRevenue: number;
  churnRate: number;
  revenueByMonth: { month: string; revenue: number }[];
  subscriptionSummary: { active: number; cancelled: number };
  overdueInvoices: any[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getData() {
    return this.http.get<DashboardData>(`${apiUrl}/dashboard`);
  }
}

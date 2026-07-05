import { Plan } from './plan.model';
import { Customer } from './customer.model';

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  startDate: string;
  endDate?: string;
  cancelledAt?: string;
  customer?: Customer;
  plan?: Plan;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFormData {
  customerId: string;
  planId: string;
  startDate: string;
}

export interface SubscriptionSummary {
  active: number;
  cancelled: number;
  total: number;
}

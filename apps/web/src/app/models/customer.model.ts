export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  organizationId: string;
  hasActiveSubscription?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

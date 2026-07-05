export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  cycle: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFormData {
  name: string;
  description: string;
  price: number;
  cycle: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'transfer' | 'card' | 'cash';
  date: string;
  reference?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFormData {
  method: 'transfer' | 'card' | 'cash';
  date: string;
  reference?: string;
}

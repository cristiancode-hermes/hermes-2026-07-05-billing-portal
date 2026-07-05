import { Customer } from './customer.model';
import { InvoiceItem } from './invoice-item.model';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: Customer;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  dueDate: string;
  issuedDate: string;
  paidAt?: string;
  items?: InvoiceItem[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFormData {
  customerId: string;
  items: InvoiceItem[];
  taxRate: number;
  dueDate: string;
}

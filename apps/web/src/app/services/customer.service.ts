import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Customer, CustomerFormData } from '../models/customer.model';

const apiUrl = '/api';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);

  getAll(params?: { search?: string; page?: number; limit?: number }) {
    return this.http.get<{ data: Customer[]; total: number; page: number; limit: number }>(`${apiUrl}/customers`, { params: params as any });
  }

  getById(id: string) {
    return this.http.get<Customer>(`${apiUrl}/customers/${id}`);
  }

  create(data: CustomerFormData) {
    return this.http.post<Customer>(`${apiUrl}/customers`, data);
  }

  update(id: string, data: Partial<CustomerFormData>) {
    return this.http.put<Customer>(`${apiUrl}/customers/${id}`, data);
  }
}

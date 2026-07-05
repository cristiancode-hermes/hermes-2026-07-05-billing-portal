import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Organization } from '../models/organization.model';

const apiUrl = '/api';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  get() {
    return this.http.get<Organization>(`${apiUrl}/settings`);
  }

  update(data: { name: string; currency: string; defaultTaxRate: number }) {
    return this.http.put<Organization>(`${apiUrl}/settings`, data);
  }
}

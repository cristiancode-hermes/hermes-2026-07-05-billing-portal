import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Plan, PlanFormData } from '../models/plan.model';

const apiUrl = '/api';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly http = inject(HttpClient);

  getAll() {
    return this.http.get<Plan[]>(`${apiUrl}/plans`);
  }

  getById(id: string) {
    return this.http.get<Plan>(`${apiUrl}/plans/${id}`);
  }

  create(data: PlanFormData) {
    return this.http.post<Plan>(`${apiUrl}/plans`, data);
  }

  update(id: string, data: Partial<PlanFormData>) {
    return this.http.put<Plan>(`${apiUrl}/plans/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete<void>(`${apiUrl}/plans/${id}`);
  }
}

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanService } from '../../services/plan.service';
import { ErrorAlertComponent } from '../../shared/error-alert/error-alert.component';

@Component({
  selector: 'app-plan-form-page',
  standalone: true,
  imports: [FormsModule, ErrorAlertComponent],
  template: `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">
        {{ isEdit() ? 'Edit Plan' : 'Create Plan' }}
      </h1>

      @if (loading()) {
        <div class="bg-white dark:bg-secondary-800 rounded-xl p-6 animate-pulse space-y-4">
          <div class="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/3"></div>
          <div class="h-10 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
          <div class="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/4"></div>
          <div class="h-10 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
        </div>
      } @else if (loadError()) {
        <app-error-alert [message]="loadError()" (retry)="loadPlan()" />
      } @else {
        <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          @if (saveError()) {
            <div class="mb-4 p-3 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg text-sm text-danger-600 dark:text-danger-400">
              {{ saveError() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Name</label>
              <input
                type="text"
                [(ngModel)]="name"
                name="name"
                required
                class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Pro Plan"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Description</label>
              <textarea
                [(ngModel)]="description"
                name="description"
                rows="3"
                class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe what this plan includes..."
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Price</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500 dark:text-secondary-400">\$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    [(ngModel)]="price"
                    name="price"
                    required
                    class="w-full pl-8 pr-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="29.99"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Billing Cycle</label>
                <select
                  [(ngModel)]="cycle"
                  name="cycle"
                  class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Features (one per line)</label>
              <textarea
                [(ngModel)]="featuresText"
                name="featuresText"
                rows="5"
                class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              ></textarea>
            </div>

            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                [(ngModel)]="isActive"
                name="isActive"
                class="w-4 h-4 rounded border-secondary-300 dark:border-secondary-600 text-primary-500 focus:ring-primary-500"
              />
              <label for="isActive" class="text-sm text-secondary-700 dark:text-secondary-300">Active (visible to customers)</label>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                type="submit"
                [disabled]="saving()"
                class="px-6 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
              >
                @if (saving()) {
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Saving...
                } @else {
                  {{ isEdit() ? 'Update Plan' : 'Create Plan' }}
                }
              </button>
              <button type="button" (click)="goBack()" class="px-6 py-2.5 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class PlanFormPage implements OnInit {
  private readonly planService = inject(PlanService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly isEdit = signal(false);
  protected readonly planId = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal('');
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly price = signal<number>(0);
  protected readonly cycle = signal<'monthly' | 'yearly'>('monthly');
  protected readonly featuresText = signal('');
  protected readonly isActive = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.planId.set(id);
      this.loadPlan();
    }
  }

  protected loadPlan() {
    const id = this.planId();
    if (!id) return;
    this.loading.set(true);
    this.planService.getById(id).subscribe({
      next: (plan) => {
        this.name.set(plan.name);
        this.description.set(plan.description || '');
        this.price.set(plan.price);
        this.cycle.set(plan.cycle);
        this.featuresText.set(plan.features?.join('\n') || '');
        this.isActive.set(plan.isActive);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(err.error?.message || 'Failed to load plan');
        this.loading.set(false);
      },
    });
  }

  protected onSubmit() {
    if (!this.name()) return;
    this.saving.set(true);
    this.saveError.set('');

    const data = {
      name: this.name(),
      description: this.description(),
      price: this.price(),
      cycle: this.cycle(),
      features: this.featuresText().split('\n').map((f) => f.trim()).filter((f) => f),
      isActive: this.isActive(),
    };

    const request = this.isEdit()
      ? this.planService.update(this.planId()!, data)
      : this.planService.create(data);

    request.subscribe({
      next: () => this.router.navigate(['/plans']),
      error: (err) => {
        this.saveError.set(err.error?.message || 'Failed to save plan');
        this.saving.set(false);
      },
    });
  }

  protected goBack() {
    this.router.navigate(['/plans']);
  }
}

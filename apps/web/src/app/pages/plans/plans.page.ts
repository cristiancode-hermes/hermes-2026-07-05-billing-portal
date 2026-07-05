import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PlanService } from '../../services/plan.service';
import { Plan } from '../../models/plan.model';
import { SkeletonCardComponent } from '../../shared/skeleton-card/skeleton-card.component';
import { ErrorAlertComponent } from '../../shared/error-alert/error-alert.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { StatusPillComponent } from '../../shared/status-pill/status-pill.component';
import { PriceDisplayComponent } from '../../shared/price-display/price-display.component';

@Component({
  selector: 'app-plans-page',
  standalone: true,
  imports: [RouterLink, SkeletonCardComponent, ErrorAlertComponent, EmptyStateComponent, ConfirmDialogComponent, StatusPillComponent, PriceDisplayComponent],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Plans</h1>
      <a routerLink="/plans/new" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Plan
      </a>
    </div>

    @if (loading()) {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (_ of [1,2,3]; track $index) {
          <app-skeleton-card />
        }
      </div>
    } @else if (error()) {
      <app-error-alert [message]="error()" (retry)="loadPlans()" />
    } @else if (plans().length === 0) {
      <app-empty-state
        title="Create your first plan"
        message="Plans define what your customers subscribe to. Create a monthly or yearly plan to get started."
        ctaLabel="Create Plan"
        (cta)="router.navigate(['/plans/new'])"
      />
    } @else {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (plan of plans(); track plan.id) {
          <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-3">
              <h3 class="text-lg font-semibold text-secondary-900 dark:text-secondary-100">{{ plan.name }}</h3>
              <app-status-pill [status]="plan.isActive ? 'active' : 'inactive'" />
            </div>
            <div class="mb-3">
              <app-price-display [price]="plan.price" />
              <span class="text-sm text-secondary-500 dark:text-secondary-400"> / {{ plan.cycle }}</span>
            </div>
            @if (plan.description) {
              <p class="text-sm text-secondary-500 dark:text-secondary-400 mb-3">{{ plan.description }}</p>
            }
            @if (plan.features?.length) {
              <ul class="space-y-1 mb-4">
                @for (feat of plan.features; track feat) {
                  <li class="text-sm text-secondary-600 dark:text-secondary-400 flex items-center gap-2">
                    <svg class="w-4 h-4 text-accent-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ feat }}
                  </li>
                }
              </ul>
            }
            <div class="flex gap-2 mt-auto pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <a [routerLink]="['/plans', plan.id, 'edit']" class="flex-1 text-center px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-lg transition-colors">
                Edit
              </a>
              <button (click)="confirmDelete(plan)" class="flex-1 px-3 py-2 text-sm font-medium text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 hover:bg-danger-100 dark:hover:bg-danger-500/20 rounded-lg transition-colors">
                Delete
              </button>
            </div>
          </div>
        }
      </div>
    }

    <app-confirm-dialog
      [visible]="deleteDialogVisible()"
      [title]="'Delete ' + (planToDelete()?.name || 'plan') + '?'"
      message="This action cannot be undone. It will fail if the plan has active subscriptions."
      confirmLabel="Delete"
      (cancel)="deleteDialogVisible.set(false)"
      (confirm)="onDeletePlan()"
    />
  `,
})
export class PlansPage {
  protected readonly planService = inject(PlanService);
  protected readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly plans = signal<Plan[]>([]);
  protected readonly deleteDialogVisible = signal(false);
  protected readonly planToDelete = signal<Plan | null>(null);
  protected readonly deleteError = signal('');

  constructor() {
    this.loadPlans();
  }

  protected loadPlans() {
    this.loading.set(true);
    this.error.set('');
    this.planService.getAll().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load plans');
        this.loading.set(false);
      },
    });
  }

  protected confirmDelete(plan: Plan) {
    this.planToDelete.set(plan);
    this.deleteDialogVisible.set(true);
  }

  protected onDeletePlan() {
    const plan = this.planToDelete();
    if (!plan) return;
    this.planService.delete(plan.id).subscribe({
      next: () => {
        this.deleteDialogVisible.set(false);
        this.planToDelete.set(null);
        this.plans.update((p) => p.filter((x) => x.id !== plan.id));
      },
      error: (err) => {
        const msg = err.error?.message || 'Cannot delete plan with active subscriptions';
        this.deleteError.set(msg);
        this.deleteDialogVisible.set(false);
        this.error.set(msg);
      },
    });
  }
}

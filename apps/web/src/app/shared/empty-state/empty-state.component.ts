import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="w-16 h-16 mb-4 text-secondary-400 dark:text-secondary-500">
        <ng-content select="[icon]">
          <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </ng-content>
      </div>
      <h3 class="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">{{ title() }}</h3>
      @if (message()) {
        <p class="text-secondary-500 dark:text-secondary-400 mb-6 max-w-md">{{ message() }}</p>
      }
      @if (ctaLabel()) {
        <button
          (click)="cta.emit()"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
        >
          {{ ctaLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input<string>();
  readonly ctaLabel = input<string>();
  readonly cta = output<void>();
}

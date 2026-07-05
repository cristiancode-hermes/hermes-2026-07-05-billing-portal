import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100">{{ title() }}</h1>
      @if (actionLabel()) {
        <button
          (click)="action.emit()"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly actionLabel = input<string>();
  readonly action = output<void>();
}

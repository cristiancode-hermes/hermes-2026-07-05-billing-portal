import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  template: `
    <div class="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-xl p-6 text-center">
      <svg class="w-12 h-12 mx-auto mb-3 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-danger-700 dark:text-danger-400 font-medium mb-1">Something went wrong</p>
      @if (message()) {
        <p class="text-danger-500 dark:text-danger-500 text-sm mb-4">{{ message() }}</p>
      }
      @if (showRetry()) {
        <button
          (click)="retry.emit()"
          class="px-4 py-2 text-sm font-medium text-white bg-danger-500 hover:bg-danger-600 rounded-lg transition-colors"
        >
          Try Again
        </button>
      }
    </div>
  `,
})
export class ErrorAlertComponent {
  readonly message = input<string>();
  readonly showRetry = input(true);
  readonly retry = output<void>();
}

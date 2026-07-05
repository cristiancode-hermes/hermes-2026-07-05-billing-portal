import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" (click)="cancel.emit()"></div>
        <div class="relative bg-white dark:bg-secondary-800 rounded-xl shadow-2xl p-6 w-full max-w-md z-10">
          <h3 class="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">{{ title() }}</h3>
          <p class="text-secondary-600 dark:text-secondary-400 mb-6">{{ message() }}</p>
          <div class="flex justify-end gap-3">
            <button
              (click)="cancel.emit()"
              class="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirm.emit()"
              class="px-4 py-2 text-sm font-medium text-white bg-danger-500 hover:bg-danger-600 rounded-lg transition-colors"
            >
              {{ confirmLabel() || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly visible = input(false);
  readonly title = input('Are you sure?');
  readonly message = input('This action cannot be undone.');
  readonly confirmLabel = input('Confirm');
  readonly cancel = output<void>();
  readonly confirm = output<void>();
}

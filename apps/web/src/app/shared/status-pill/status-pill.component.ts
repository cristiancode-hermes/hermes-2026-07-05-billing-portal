import { Component, input } from '@angular/core';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  template: `
    <span [class]="pillClass()" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
      {{ status() }}
    </span>
  `,
})
export class StatusPillComponent {
  readonly status = input.required<string>();

  protected pillClass() {
    const s = this.status().toLowerCase();
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize';
    switch (s) {
      case 'active':
      case 'paid':
      case 'sent':
        return `${base} bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-500`;
      case 'cancelled':
      case 'void':
      case 'expired':
        return `${base} bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500`;
      case 'draft':
        return `${base} bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-400`;
      case 'overdue':
        return `${base} bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500`;
      case 'paused':
        return `${base} bg-secondary-200 text-secondary-700 dark:bg-secondary-600 dark:text-secondary-300`;
      default:
        return `${base} bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300`;
    }
  }
}

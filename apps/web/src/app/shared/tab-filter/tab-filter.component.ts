import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-tab-filter',
  standalone: true,
  template: `
    <div class="flex gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
      @for (tab of tabs(); track tab.value) {
        <button
          (click)="selectedChange.emit(tab.value)"
          class="px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize"
          [class]="tab.value === selected()
            ? 'bg-white dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'"
        >
          {{ tab.label }}
        </button>
      }
    </div>
  `,
})
export class TabFilterComponent {
  readonly tabs = input.required<{ label: string; value: string }[]>();
  readonly selected = input<string>();
  readonly selectedChange = output<string>();
}

import { Component, input, output, signal, effect } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  template: `
    <div class="relative">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
        class="w-full pl-10 pr-4 py-2 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </div>
  `,
})
export class SearchBarComponent {
  readonly placeholder = input('Search...');
  readonly value = input('');
  readonly search = output<string>();
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  protected onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.search.emit(val);
    }, 300);
  }
}

import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm animate-pulse">
      <div class="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/3 mb-4"></div>
      <div class="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2 mb-3"></div>
      <div class="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-2/3"></div>
    </div>
  `,
})
export class SkeletonCardComponent {}

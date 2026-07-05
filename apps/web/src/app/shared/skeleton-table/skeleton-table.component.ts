import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-secondary-800 rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div class="divide-y divide-secondary-200 dark:divide-secondary-700">
        @for (row of rowArray(); track $index) {
          <div class="p-4 flex gap-4">
            @for (col of colArray(); track $index) {
              <div class="h-4 bg-secondary-200 dark:bg-secondary-700 rounded flex-1"></div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class SkeletonTableComponent {
  readonly rows = input(5);
  readonly columns = input(4);

  protected rowArray() {
    return Array(this.rows());
  }
  protected colArray() {
    return Array(this.columns());
  }
}

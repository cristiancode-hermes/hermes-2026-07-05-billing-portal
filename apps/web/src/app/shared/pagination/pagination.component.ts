import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center justify-center gap-2 mt-6">
        <button
          (click)="goToPage(currentPage() - 1)"
          [disabled]="currentPage() <= 1"
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          [class]="currentPage() <= 1
            ? 'text-secondary-400 dark:text-secondary-500'
            : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        @for (page of visiblePages(); track page) {
          <button
            (click)="goToPage(page)"
            class="px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            [class]="page === currentPage()
              ? 'bg-primary-500 text-white'
              : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'"
          >
            {{ page }}
          </button>
        }

        <button
          (click)="goToPage(currentPage() + 1)"
          [disabled]="currentPage() >= totalPages()"
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          [class]="currentPage() >= totalPages()
            ? 'text-secondary-400 dark:text-secondary-500'
            : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    }
  `,
})
export class PaginationComponent {
  readonly currentPage = input(1);
  readonly totalPages = input(1);
  readonly pageChange = output<number>();

  protected visiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  protected goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }
}

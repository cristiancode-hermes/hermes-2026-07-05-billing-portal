import { Component, input, signal, effect } from '@angular/core';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (visible()) {
      <div
        class="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300"
        [class]="toastClass"
      >
        @switch (type()) {
          @case ('success') {
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          }
          @case ('error') {
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
          @default {
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        }
        <span class="text-sm font-medium">{{ message() }}</span>
        <button (click)="dismiss()" class="ml-2 shrink-0 opacity-70 hover:opacity-100">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    }
  `,
})
export class ToastComponent {
  readonly message = input('');
  readonly type = input<'success' | 'error' | 'info'>('info');
  readonly duration = input(4000);
  readonly visible = signal(false);
  private timeoutId: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      if (this.message()) {
        this.visible.set(true);
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => this.dismiss(), this.duration());
      }
    });
  }

  protected get toastClass(): string {
    switch (this.type()) {
      case 'success': return 'bg-accent-500 text-white';
      case 'error': return 'bg-danger-500 text-white';
      default: return 'bg-primary-500 text-white';
    }
  }

  dismiss() {
    this.visible.set(false);
    clearTimeout(this.timeoutId);
  }
}

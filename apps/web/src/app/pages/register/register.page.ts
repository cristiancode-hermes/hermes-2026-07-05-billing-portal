import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="bg-white dark:bg-secondary-800 rounded-2xl shadow-xl p-8">
          <div class="text-center mb-8">
            <h1 class="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Create Account</h1>
            <p class="text-secondary-500 dark:text-secondary-400 mt-2">Set up your billing organization</p>
          </div>

          @if (error()) {
            <div class="mb-4 p-3 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg text-sm text-danger-600 dark:text-danger-400">
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label for="orgName" class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Organization Name</label>
              <input
                id="orgName"
                type="text"
                [(ngModel)]="orgName"
                name="orgName"
                required
                class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="My Company"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Email</label>
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                autocomplete="email"
                class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Password</label>
              <input
                id="password"
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="new-password"
                class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                required
                class="w-full px-4 py-2.5 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Re-enter password"
              />
            </div>

            <button
              type="submit"
              [disabled]="loading()"
              class="w-full py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              @if (loading()) {
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Creating account...
              } @else {
                Create Account
              }
            </button>
          </form>

          <p class="text-center text-sm text-secondary-500 dark:text-secondary-400 mt-6">
            Already have an account?
            <a routerLink="/login" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly orgName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected onSubmit() {
    if (!this.orgName() || !this.email() || !this.password()) return;
    if (this.password() !== this.confirmPassword()) {
      this.error.set('Passwords do not match');
      return;
    }
    if (this.password().length < 8) {
      this.error.set('Password must be at least 8 characters');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.authService.register(this.orgName(), this.email(), this.password()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message || 'Registration failed');
        this.loading.set(false);
      },
    });
  }
}

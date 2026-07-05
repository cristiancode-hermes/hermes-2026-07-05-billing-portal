import { ApplicationConfig, provideZonelessChangeDetection, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './services/auth.interceptor';

export const routes: Routes = [
  // Auth routes (no sidebar)
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage) },

  // Main app routes (with sidebar — MainLayout)
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayout),
    canActivate: [() => {
      const auth = inject(AuthService);
      if (!auth.isAuthenticated()) return inject(Router).navigate(['/login']);
      return true;
    }],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'plans', loadComponent: () => import('./pages/plans/plans.page').then(m => m.PlansPage) },
      { path: 'plans/new', loadComponent: () => import('./pages/plan-form/plan-form.page').then(m => m.PlanFormPage) },
      { path: 'plans/:id/edit', loadComponent: () => import('./pages/plan-form/plan-form.page').then(m => m.PlanFormPage) },
      { path: 'customers', loadComponent: () => import('./pages/customers/customers.page').then(m => m.CustomersPage) },
      { path: 'customers/new', loadComponent: () => import('./pages/customer-form/customer-form.page').then(m => m.CustomerFormPage) },
      { path: 'customers/:id', loadComponent: () => import('./pages/customer-detail/customer-detail.page').then(m => m.CustomerDetailPage) },
      { path: 'customers/:id/edit', loadComponent: () => import('./pages/customer-form/customer-form.page').then(m => m.CustomerFormPage) },
      { path: 'subscriptions', loadComponent: () => import('./pages/subscriptions/subscriptions.page').then(m => m.SubscriptionsPage) },
      { path: 'subscriptions/new', loadComponent: () => import('./pages/subscription-form/subscription-form.page').then(m => m.SubscriptionFormPage) },
      { path: 'subscriptions/:id', loadComponent: () => import('./pages/subscription-detail/subscription-detail.page').then(m => m.SubscriptionDetailPage) },
      { path: 'invoices', loadComponent: () => import('./pages/invoices/invoices.page').then(m => m.InvoicesPage) },
      { path: 'invoices/new', loadComponent: () => import('./pages/invoice-wizard/invoice-wizard.page').then(m => m.InvoiceWizardPage) },
      { path: 'invoices/:id', loadComponent: () => import('./pages/invoice-detail/invoice-detail.page').then(m => m.InvoiceDetailPage) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },

  { path: '**', redirectTo: 'dashboard' },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ]
};

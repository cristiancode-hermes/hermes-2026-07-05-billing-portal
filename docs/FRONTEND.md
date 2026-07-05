# Frontend Architecture

## Overview

The frontend is an **Angular 22** application using:
- **Standalone components** (no NgModules)
- **Zoneless change detection** (`provideZonelessChangeDetection()`)
- **Signals** for all reactive state (`signal`, `computed`, `input`, `output`)
- **Lazy-loaded page components** via `loadComponent()` in routes
- **Tailwind CSS 4** with a custom theme
- **Angular HttpClient** with an interceptor for JWT auth

---

## Signal Architecture

Angular signals provide a reactive, predictable way to manage state without Zone.js.

### Core Patterns

**1. Service-level signals** — Services expose readonly signals for shared state:

```typescript
// AuthService
private readonly userSignal = signal<User | null>(null);
readonly user = this.userSignal.asReadonly();
readonly isAuthenticated = computed(() => !!this.userSignal() || !!this.getToken());
```

**2. Component-level signals** — Pages use `signal()` for loading, error, and data states:

```typescript
protected readonly loading = signal(true);
protected readonly error = signal('');
protected readonly data = signal<DashboardData | null>(null);
protected readonly isEmpty = computed(() => !this.data() && !this.loading() && !this.error());
```

**3. Computed derivations** — Values derived from other signals update automatically:

```typescript
// InvoiceWizardPage
protected readonly subtotal = computed(() =>
  this.items().reduce((sum, item) => sum + item.total, 0)
);
protected readonly taxAmount = computed(() => this.subtotal() * (this.taxRate() / 100));
protected readonly total = computed(() => this.subtotal() + this.taxAmount());
```

**4. Two-way binding with `ngModel`** — Signals are used with `[(ngModel)]` in forms. Form-bound signals are mutable (`signal`), while derived values are `computed`.

**5. Input/output signals** — Shared components use `input()` and `output()`:

```typescript
// StatusPillComponent
readonly status = input.required<string>();

// EmptyStateComponent
readonly title = input.required<string>();
readonly cta = output<void>();
```

### Signal vs. Traditional Patterns

| Concern | Signal Approach | Traditional (Zone.js) |
|---------|----------------|----------------------|
| Async data | `signal()` + `computed()` | `async` pipe with Observables |
| State management | `signal` / `computed` | Services with BehaviorSubject |
| Component inputs | `input()` | `@Input()` decorator |
| Component outputs | `output()` | `@Output()` + EventEmitter |
| Two-way form binding | `[(ngModel)]` with signal | `[(ngModel)]` with class property |
| Change detection | Automatic (signal changes trigger render) | Zone.js monkey-patching + markForCheck |

---

## Component Tree

```
App (root)
├── RouterOutlet
│
├── LoginPage              — /login
├── RegisterPage           — /register
│
└── MainLayout             — / (authenticated routes)
    ├── Sidebar
    │   ├── Navigation items (6 links)
    │   └── Mobile overlay
    ├── Header
    │   ├── Mobile hamburger
    │   ├── Dark mode toggle button
    │   ├── User avatar + dropdown menu
    │   └── Sign out
    └── RouterOutlet
        │
        ├── DashboardPage              — /dashboard
        │   ├── SkeletonCardComponent  (loading state)
        │   ├── ErrorAlertComponent    (error state)
        │   ├── EmptyStateComponent    (empty state)
        │   └── StatusPillComponent    (invoice status)
        │
        ├── PlansPage                  — /plans
        │   └── StatusPillComponent
        │
        ├── PlanFormPage               — /plans/new, /plans/:id/edit
        │
        ├── CustomersPage              — /customers
        │   ├── SearchBarComponent
        │   ├── PaginationComponent
        │   ├── TabFilterComponent
        │   └── StatusPillComponent
        │
        ├── CustomerDetailPage         — /customers/:id
        │   ├── StatusPillComponent
        │   └── PriceDisplayComponent
        │
        ├── CustomerFormPage           — /customers/new, /customers/:id/edit
        │
        ├── SubscriptionsPage          — /subscriptions
        │   ├── StatusPillComponent
        │   └── PriceDisplayComponent
        │
        ├── SubscriptionDetailPage     — /subscriptions/:id
        │   ├── StatusPillComponent
        │   ├── PriceDisplayComponent
        │   ├── LoadingSpinnerComponent
        │   └── ErrorAlertComponent
        │
        ├── SubscriptionFormPage       — /subscriptions/new
        │
        ├── InvoicesPage               — /invoices
        │   ├── StatusPillComponent
        │   └── PriceDisplayComponent
        │
        ├── InvoiceDetailPage          — /invoices/:id
        │   ├── StatusPillComponent
        │   └── PriceDisplayComponent
        │
        ├── InvoiceWizardPage          — /invoices/new
        │   └── ErrorAlertComponent
        │
        └── SettingsPage               — /settings
```

### Shared Components (12 total)

| Component | Selector | Purpose |
|-----------|----------|---------|
| `StatusPillComponent` | `app-status-pill` | Color-coded status badge (active/pending/draft/paid/overdue/cancelled) |
| `PriceDisplayComponent` | `app-price-display` | Formatted currency display with atomic symbol |
| `PageHeaderComponent` | `app-page-header` | Consistent page title + breadcrumb |
| `SearchBarComponent` | `app-search-bar` | Debounced search input with clear button |
| `PaginationComponent` | `app-pagination` | Page navigation with prev/next + page numbers |
| `TabFilterComponent` | `app-tab-filter` | Tab-style filter (All / Active / Cancelled / etc.) |
| `LoadingSpinnerComponent` | `app-loading-spinner` | Centered spinner animation |
| `SkeletonCardComponent` | `app-skeleton-card` | Placeholder card for loading state (pulse animation) |
| `SkeletonTableComponent` | `app-skeleton-table` | Placeholder table rows for loading state |
| `ErrorAlertComponent` | `app-error-alert` | Error display with optional retry button |
| `EmptyStateComponent` | `app-empty-state` | Empty state with title, message, optional CTA button |
| `ConfirmDialogComponent` | `app-confirm-dialog` | Modal confirmation dialog (overlay + backdrop) |
| `ToastComponent` | `app-toast` | Auto-dismissing notification (success/error/info) |

---

## State Management (Loading / Empty / Error Pattern)

Every page follows a consistent state management pattern:

```html
@if (loading()) {
  <app-loading-spinner />
  <!-- or <app-skeleton-card /> / <app-skeleton-table /> -->
} @else if (error()) {
  <app-error-alert [message]="error()" (retry)="loadData()" />
} @else if (isEmpty()) {
  <app-empty-state
    title="Start creating"
    message="Add your first item to get started."
    ctaLabel="Create"
    (cta)="onCreate()"
  />
} @else {
  <!-- Actual content -->
}
```

### Signal Triplet Pattern

Each page defines three signals:

```typescript
// 1. Loading state — starts true, set false when data arrives or fails
protected readonly loading = signal(true);

// 2. Error state — blank initially, set on API failure
protected readonly error = signal('');

// 3. Data state — null initially, set on success
protected readonly data = signal<T | null>(null);
```

The `isEmpty` computed property:

```typescript
protected readonly isEmpty = computed(() =>
  !this.data() && !this.loading() && !this.error()
);
```

### Data Loading Pattern

Data is loaded in the constructor (or `ngOnInit` for components that need it):

```typescript
constructor() {
  this.loadData();
}

protected loadData() {
  this.loading.set(true);
  this.error.set('');
  this.service.getAll().subscribe({
    next: (result) => {
      this.data.set(result);
      this.loading.set(false);
    },
    error: (err) => {
      this.error.set(err.error?.message || 'Something went wrong');
      this.loading.set(false);
    },
  });
}
```

### Lists with Pagination

```typescript
protected readonly items = signal<T[]>([]);
protected readonly total = signal(0);
protected readonly currentPage = signal(1);

protected loadData() {
  this.loading.set(true);
  this.service.getAll({ page: this.currentPage(), limit: 10, search: this.search() })
    .subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: ...
    });
}
```

---

## Zoneless Notes

### What Works

- **`signal()` / `computed()` / `effect()`** — The primary reactive primitives. Templates render when signals change.
- **`input()` / `output()`** — Standard Angular component communication.
- **`@if` / `@for` / `@switch`** — Angular control flow blocks work with signals.
- **`[(ngModel)]`** — Two-way binding with signals works in zoneless mode (signals implement the necessary contract).
- **`HttpClient`** — Async HTTP calls trigger template updates because the response callback sets signals.
- **`Router` navigation** — Route changes work without Zone.js.
- **Lifecycle hooks** — `constructor`, `ngOnInit`, `ngOnDestroy` all fire correctly.

### What Doesn't Work Without Zone.js

- **`setTimeout()` / `setInterval()` callbacks** that modify component state will NOT trigger change detection unless they set signals.
- **`addEventListener()`** (manual DOM event listeners) — Angular handles template-bound events, but custom DOM listeners need to call `ChangeDetectorRef.detectChanges()` or set a signal.
- **Third-party libraries** that modify state outside Angular's signal system.

### Best Practices for Zoneless

1. **Always use signals for mutable state** — Never use plain class properties that change over time.
2. **Use `effect()` for side effects** — Instead of `ngOnChanges`, use `effect(() => { ... })` to react to signal changes.
3. **Wrap external callbacks** — If using a non-Angular callback (e.g., ResizeObserver), update a signal rather than a plain property.
4. **`ChangeDetectorRef.markForCheck()`** is rarely needed but available as a escape hatch.

---

## Dark Mode Implementation

### Architecture

The `ThemeService` (provided in root) manages dark mode:

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeSignal = signal<'light' | 'dark'>('light');
  readonly theme = this.themeSignal.asReadonly();

  constructor() {
    // 1. Check localStorage for saved preference
    // 2. Fall back to system preference (prefers-color-scheme)
    // 3. Apply theme by toggling `.dark` class on <html>
  }

  toggle() {
    // Flip theme, save to localStorage, apply to DOM
  }
}
```

### Tailwind Configuration

The dark mode uses the `@custom-variant dark (&:where(.dark, .dark *))` Tailwind 4 approach. The `.dark` class on `<html>` inverts the secondary color palette:

```css
/* styles.css */
@custom-variant dark (&:where(.dark, .dark *));

.dark {
  --color-secondary-50: #0f172a;  /* was: #f8fafc */
  --color-secondary-100: #1e293b;
  --color-secondary-200: #334155;
  /* ... inverted ... */
  --color-secondary-900: #f8fafc;
}
```

The primary, accent, warning, and danger palettes remain unchanged — only the neutral/secondary palette inverts, creating a visual shift without losing brand colors.

### Usage in Templates

```html
<!-- Standard dark mode classes -->
<div class="bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100">
  Content
</div>

<!-- Conditionally rendered icons -->
@if (themeService.theme() === 'dark') {
  <svg><!-- sun icon --></svg>
} @else {
  <svg><!-- moon icon --></svg>
}
```

### Persistence Flow

1. **On service init**: Check `localStorage.getItem('billing_theme')`. If not set, check `window.matchMedia('(prefers-color-scheme: dark)')`.
2. **On toggle**: Save to `localStorage`, toggle `.dark` class on `<html>`.
3. **On page load**: The theme class is applied before Angular bootstraps (via inline `<script>` in `index.html` if needed, or via the service constructor).

---

## HTTP Services

All services follow the same pattern:

```typescript
@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly http = inject(HttpClient);

  getAll() {
    return this.http.get<Plan[]>(`${apiUrl}/plans`);
  }

  getById(id: string) {
    return this.http.get<Plan>(`${apiUrl}/plans/${id}`);
  }

  create(data: PlanFormData) {
    return this.http.post<Plan>(`${apiUrl}/plans`, data);
  }

  update(id: string, data: Partial<PlanFormData>) {
    return this.http.put<Plan>(`${apiUrl}/plans/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete<void>(`${apiUrl}/plans/${id}`);
  }
}
```

### Auth Interceptor

The `authInterceptor` (functional interceptor) attaches the JWT token to every outgoing request:

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('billing_token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
```

### API Proxying

The Angular dev server proxies `/api/*` requests to NestJS via the Angular CLI proxy configuration. This avoids CORS during development.

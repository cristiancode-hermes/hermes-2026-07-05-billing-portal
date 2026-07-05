# Architecture

## System Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend — Angular 22 (Standalone, Zoneless)"]
        AC[App Config<br/>provideZonelessChangeDetection<br/>provideRouter, provideHttpClient]
        AL[Auth Layout<br/>Login / Register Pages]
        ML[Main Layout<br/>Responsive Sidebar + Header]
        P1[Dashboard Page]
        P2[Plans Page / Form]
        P3[Customers Page / Detail / Form]
        P4[Subscriptions Page / Detail / Form]
        P5[Invoices Page / Detail / Wizard]
        P6[Settings Page]

        AC --> AL
        AC --> ML
        ML --> P1 & P2 & P3 & P4 & P5 & P6
    end

    subgraph Services["Angular HTTP Services"]
        AS[AuthService<br/>login / register / me / logout]
        PS[PlanService<br/>getAll / getById / create / update / delete]
        CS[CustomerService<br/>getAll / getById / create / update]
        SS[SubscriptionService<br/>getAll / getById / create / cancel<br/>reactivate / changePlan]
        IS[InvoiceService<br/>getAll / getById / create / send / pay]
        DS[DashboardService<br/>getData — aggregates 4 endpoints]
        STS[SettingsService<br/>get / update]
        TS[ThemeService<br/>dark mode toggle + localStorage]
    end

    subgraph Backend["NestJS 11 API Server"]
        ACtr[AuthController<br/>POST /auth/register<br/>POST /auth/login<br/>GET /auth/me]
        ASvc[AuthService<br/>org+user creation<br/>bcrypt + JWT sign]
        PCtr[PlansController<br/>GET/POST /plans<br/>PUT/DELETE /plans/:id]
        PSvc[PlansService<br/>CRUD + active-sub check]
        CCtr[CustomersController<br/>GET/POST /customers<br/>PUT /customers/:id<br/>DELETE /customers/:id]
        CSvc[CustomersService<br/>CRUD + LIKE search + pagination]
        SCtr[SubscriptionsController<br/>GET/POST /subscriptions<br/>POST :id/cancel<br/>POST :id/reactivate<br/>POST :id/change-plan]
        SSvc[SubscriptionsService<br/>lifecycle + proration<br/>auto invoice generation]
        ICtr[InvoicesController<br/>GET/POST /invoices<br/>POST :id/send/:id/pay<br/>POST :id/cancel/:id/mark-overdue]
        ISvc[InvoicesService<br/>status machine + payments]
        DCtr[DashboardController<br/>GET /dashboard/kpis<br/>GET /dashboard/revenue-chart<br/>GET /dashboard/overdue-invoices<br/>GET /dashboard/subscription-summary]
        DSvc[DashboardService<br/>aggregation queries]
        StCtr[SettingsController<br/>GET/PUT /settings]
        StSvc[SettingsService<br/>org-level config]

        JG[JwtAuthGuard<br/>validates JWT → extracts userId + orgId]
        AuthMod[AuthModule]
        PlanMod[PlansModule]
        CustMod[CustomersModule]
        SubMod[SubscriptionsModule]
        InvMod[InvoicesModule]
        DashMod[DashboardModule]
        SettMod[SettingsModule]
        SeedMod[SeedModule — auto-seed on first launch]
    end

    subgraph Database["TypeORM — SQLite (dev) / Neon PostgreSQL (prod)"]
        Org[(organizations)]
        User[(users)]
        Plan[(plans)]
        Cust[(customers)]
        Sub[(subscriptions)]
        Inv[(invoices)]
        InvItem[(invoice_items)]
        Pay[(payments)]
        Sett[(settings)]
    end

    %% Frontend → Service wiring
    P1 --> DS
    P2 --> PS
    P3 --> CS
    P4 --> SS
    P5 --> IS
    P6 --> STS
    AC --> AS

    %% Service → HTTP interceptor
    AS & PS & CS & SS & IS & DS & STS --> AI[authInterceptor<br/>Attaches Bearer token]
    AI -->|HTTP| Backend

    %% Backend controllers → services
    ACtr --> ASvc
    PCtr --> PSvc
    CCtr --> CSvc
    SCtr --> SSvc
    ICtr --> ISvc
    DCtr --> DSvc
    StCtr --> StSvc

    %% Backend guards
    PCtr & CCtr & SCtr & ICtr & DCtr & StCtr --> JG

    %% Services → ORM → Database
    ASvc -->|TypeORM| Org & User & Sett
    PSvc -->|TypeORM| Plan & Sub
    CSvc -->|TypeORM| Cust
    SSvc -->|TypeORM| Sub & Plan & Cust & Inv & InvItem & Sett
    ISvc -->|TypeORM| Inv & InvItem & Pay & Cust & Sett
    DSvc -->|TypeORM| Sub & Inv & Pay
    StSvc -->|TypeORM| Sett & Org
    SeedMod -->|TypeORM| all 9 entities

    %% Cross-module dependencies
    ASvc -.->|creates initial| Sett
    SSvc -.->|generates| Inv & InvItem
```

## Data Flow

### Request Lifecycle
1. **Browser** makes a request to the Angular app at `http://localhost:4200`.
2. **Angular** lazy-loads the requested page component via `provideRouter` with loadComponent-based routes.
3. The **page component** injects the appropriate service, which calls `HttpClient`.
4. The **`authInterceptor`** attaches the JWT token from `localStorage` as an `Authorization: Bearer` header.
5. The request hits the **NestJS server** (proxied via Angular CLI proxy config).
6. The route is matched by a **controller**, guarded by `JwtAuthGuard`.
7. The guard extracts the token, verifies it via Passport JWT strategy, and populates `request.user` with `{ userId, organizationId, email, role }`.
8. The **controller** extracts `organizationId` from the `@CurrentUser()` decorator and passes it to the service.
9. The **service** performs business logic, querying via **TypeORM repositories** filtered by `organizationId`.
10. The response flows back: service → controller → HTTP → Angular service → component signal.

### Multi-tenant Isolation

Every entity has an `organizationId: string` column. All queries include `where: { organizationId }` as a filter. There is no separate database per tenant — this is **shared-database, shared-schema** multi-tenancy with row-level isolation.

The `JwtAuthGuard` ensures the `organizationId` comes from the signed JWT (issued at registration/login), so tenants cannot impersonate each other.

```typescript
// Pattern used across all services:
async findAll(organizationId: string) {
  return this.repository.find({
    where: { organizationId },
    order: { createdAt: 'DESC' },
  });
}
```

### Why This Architecture

- **Monorepo with two apps** (`apps/api`, `apps/web`) keeps the backend and frontend independently buildable and deployable, while sharing the same repository for coordinated changes.
- **NestJS modular structure** (`AuthModule`, `PlansModule`, etc.) maps 1:1 to business domains, making it easy to add new features without touching unrelated code.
- **Angular standalone components + zoneless** gives us a modern, tree-shakable frontend with smaller bundle sizes and no NgModule overhead.
- **Signals** (Angular 17+) replace the traditional `async` pipe + `OnPush` pattern with a simpler mental model: `signal → computed → template binding`.
- **SQLite for dev, PostgreSQL for prod** — the schema is plain SQL-compatible (no SQLite-specific features), so switching to Neon only requires changing the TypeORM driver config.
- **`synchronize: true`** in dev avoids migrations during rapid iteration. Production would use TypeORM migrations.

### Subscription Creation Flow

```
POST /subscriptions { customerId, planId }
  → 1. Validate customer + plan belong to organization
  → 2. Calculate endDate based on plan cycle (monthly +1 month, yearly +1 year)
  → 3. Create subscription record with status 'active'
  → 4. Generate first draft invoice:
       - Create invoice with subtotal = plan.price
       - Apply default tax rate from organization settings
       - Create invoice item with plan description
       - Invoice due date = issue date + 30 days
  → 5. Return subscription with customer + plan relations loaded
```

### Plan Change (Proration) Flow

```
POST /subscriptions/:id/change-plan { newPlanId }
  → 1. Validate subscription is active
  → 2. Load current plan and new plan
  → 3. Calculate days in current billing period
  → 4. Calculate days elapsed and remaining days
  → 5. Credit = (currentPlan.price / totalDays) × remainingDays
  → 6. New charge = (newPlan.price / totalDays) × remainingDays
  → 7. Adjustment = newCharge - credit (positive = charge, negative = credit)
  → 8. Update subscription to new planId
  → 9. If |adjustment| > $0.001, create adjustment invoice
```

### Invoice Status Machine

```
                      ┌─────────┐
                      │  Draft   │
                      └────┬────┘
                           │
                      ┌────▼────┐
                      │  Sent   │◄────── send()
                      └────┬────┘
                           │
               ┌───────────┼───────────┐
               │           │           │
          ┌────▼────┐ ┌────▼────┐ ┌────▼──────┐
          │  Paid   │ │ Overdue │ │ Cancelled │
          └─────────┘ └─────────┘ └───────────┘
                ▲
                │
          ┌─────┴──────┐
          │from: sent,  │
          │overdue      │
          └────────────┘

Transitions:
  draft   → send()    → sent
  sent    → pay()     → paid     (records a payment)
  sent    → overdue() → overdue
  paid    → [terminal — no outbound transitions]
  overdue → pay()     → paid
  draft   → cancel()  → cancelled
  sent    → cancel()  → cancelled
  overdue → cancel()  → cancelled
  cancelled → [terminal]
```

**Guard logic (`InvoicesService`):**
- `send()`   — only from `draft`
- `pay()`    — from `sent`, `overdue` (not from `paid` or `cancelled`)
- `cancel()` — from `draft`, `sent`, `overdue` (not from `paid`)
- `markOverdue()` — only from `sent`

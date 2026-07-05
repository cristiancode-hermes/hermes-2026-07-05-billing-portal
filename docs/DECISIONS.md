# Architecture Decision Records

A log of significant design decisions made during the build, with context, alternatives considered, and rationale.

---

## 1. Multi-tenant Isolation: Shared Schema with Row-Level Filtering

**Status:** Accepted

**Context:** The portal needs to serve multiple organizations (tenants) with complete data isolation.

**Decision:** Use a single database with an `organizationId` column on every entity. All queries filter by `organizationId`. No separate databases per tenant.

**Alternatives considered:**
1. **Separate databases per tenant** — Better isolation but harder to manage (connection pooling, migrations across N databases, no cross-tenant queries). Overkill for a SaaS MVP.
2. **Separate schema per tenant** (PostgreSQL schema per tenant) — Good isolation but complex migrations and connection management.
3. **Row-level security (RLS)** — PostgreSQL RLS policies would enforce isolation at the database level. Good but adds complexity and isn't supported by SQLite.

**Consequences:**
- ✅ Simple to implement — just add `where: { organizationId }` to every query.
- ✅ Easy migrations — one schema to manage.
- ✅ Cross-tenant queries are possible (for admin/superuser features later).
- ❌ Risk of missing the `organizationId` filter in a query (data leak). The `JwtAuthGuard` + `@CurrentUser()` pattern makes it hard to forget since the orgId is always extracted from the token.
- ❌ No hard DB-level isolation — a bug could expose data.

---

## 2. Proration Strategy: Day-weighted Linear Proration

**Status:** Accepted

**Context:** When a customer changes plans mid-cycle, we need to credit unused time on the old plan and charge for the new plan.

**Decision:** Use a simple day-weighted proration formula:

```
credit          = (oldPlanPrice / daysInPeriod) × remainingDays
newCharge       = (newPlanPrice / daysInPeriod) × remainingDays
adjustment      = newCharge - credit
```

**Alternatives considered:**
1. **Percentage-based proration** — Calculate `remaining_pct = remainingDays / daysInPeriod`, apply to both prices. Same result mathematically, less intuitive.
2. **Full refund + new charge** — Cancel old plan, create new subscription. Loses continuity (new invoice number, new start date).
3. **No proration** — Simplest but unfair to customers (they'd pay full price for both plans on the same day).
4. **Seconds-based precision** — Unnecessary. Day granularity is sufficient for subscription billing.

**Consequences:**
- ✅ Fair — customer pays exactly for time used on each plan.
- ✅ An adjustment invoice is created documenting the change (audit trail).
- ❌ Invoices can have negative amounts (credits). The UI shows a positive amount with a "credit" description.
- ❌ Does not account for partial months differently (all months treated as equal-length periods).

---

## 3. Invoice Status Machine: Immutable after Paid

**Status:** Accepted

**Context:** Invoices go through a lifecycle. We need to prevent invalid transitions.

**Decision:** Implement a status machine with the following rules:
- `draft` → can be sent, cancelled, or edited (future)
- `sent` → can be paid, marked overdue, or cancelled
- `paid` → terminal — cannot change status
- `overdue` → can be paid or cancelled
- `cancelled` → terminal — cannot change status

**Alternatives considered:**
1. **Soft state machine** — Just store a status string without validation. Dangerous — API consumers could set any status.
2. **Database enum** — TypeORM supports Postgres enums but SQLite doesn't. Not portable.
3. **State pattern** (classes for each state) — Overly complex for 5 states with simple transitions. YAGNI.

**Consequences:**
- ✅ No orphan payment records (pay always transitions invoice to paid).
- ✅ Clear transition rules enforced in the service layer.
- ✅ Audit trail via `paidAt` and `sentAt` timestamps.
- ❌ Adding new statuses (e.g., `refunded`) requires updating the guard logic.

---

## 4. SQLite for Development, PostgreSQL for Production

**Status:** Accepted

**Context:** We need rapid iteration during development but want to deploy on Neon (serverless PostgreSQL).

**Decision:** Develop with `better-sqlite3` (a synchronous, fast SQLite driver for Node.js) and design the schema to be PostgreSQL-compatible. Switch drivers for production.

**Schema compatibility choices:**
- UUID primary keys stored as text
- ISO 8601 date strings instead of native date types
- `simple-json` for JSON fields (SQLite stores as text, Postgres as jsonb)
- General SQL types (`text`, `real`, `int`, `boolean`)

**Alternatives considered:**
1. **PostgreSQL from day one** — Requires a running Postgres instance locally. Adds setup friction for new developers.
2. **In-memory SQLite** — Data lost on restart. Seed service works but inconvenient for manual testing.
3. **SQLite with native features** — Using SQLite-specific functions like `strftime()` in queries would break on Postgres. Avoided.

**Consequences:**
- ✅ Zero-setup local development.
- ✅ Same codebase, just change the TypeORM driver config.
- ❌ Some query patterns differ between SQLite and Postgres (date functions, JSON operators). Aggregation is done in application code, not SQL, to avoid this.
- ❌ SQLite's concurrency model (single writer) is fine for dev but would be a bottleneck in production.

---

## 5. Subagent Delegation Pattern for Building

**Status:** Accepted

**Context:** The project was built using an AI coding assistant (Hermes Agent). Multiple specialized subagents were delegated for different tasks.

**Decision:** Use a divide-and-conquer approach where a coordinator agent delegates to focused subagents:
- **Auth subagent** — Build the auth module (register, login, JWT strategy, guards, decorator)
- **Plan subagent** — Plan CRUD with delete protection
- **Customer subagent** — Customer CRUD with search and pagination
- **Subscription subagent** — Subscription lifecycle (create, cancel, reactivate, change plan with proration)
- **Invoice subagent** — Invoice status machine, manual invoice creation, payment recording
- **Dashboard subagent** — KPI aggregation queries
- **Settings subagent** — Organization settings
- **Seed subagent** — Demo data seeding
- **Frontend pages subagent** — Each major page gets its own subagent
- **Shared components subagent** — Reusable UI components

**Alternatives considered:**
1. **Single monolithic agent session** — Would work but context window fills up quickly. Hard to parallelize.
2. **Sequential build by one agent** — Slower, no parallel work.
3. **Manual build by human** — Fastest but not available in this context.

**Consequences:**
- ✅ Multiple subagents work in parallel, reducing wall-clock build time.
- ✅ Each subagent has a clean, focused context window.
- ✅ Clear ownership and hand-off points.
- ❌ Coordination overhead — the coordinator must ensure consistent patterns across subagents.
- ❌ Risk of duplicate or inconsistent code if hand-offs aren't clear.

---

## 6. Angular 22 Zoneless Change Detection

**Status:** Accepted

**Context:** Angular 22 introduced zoneless change detection as stable. We wanted to evaluate it for the billing portal.

**Decision:** Use `provideZonelessChangeDetection()` instead of Zone.js. All state is managed through signals (`signal()`, `computed()`, `input()`, `output()`) or `ChangeDetectorRef.markForCheck()` when needed.

**Alternatives considered:**
1. **Zone.js (default)** — Works, but adds ~30KB to bundle size and can cause unnecessary change detection cycles.
2. **OnPush strategy** — Reduces change detection but still requires Zone.js. More manual than zoneless.
3. **Signal-only (zoneless)** — The chosen approach. Simpler, more predictable, smaller bundle.

**Consequences:**
- ✅ Smaller bundle (~30KB savings from no zone.js polyfill).
- ✅ More predictable rendering — only components that depend on changed signals re-render.
- ✅ Simpler mental model — no need to worry about `NgZone.run()` or change detection triggers.
- ❌ Third-party Angular libraries that rely on Zone.js may not work. We avoided such libraries.
- ❌ Debugging with `ng.profiler` doesn't work without Zone.js.

---

## 7. Standalone Components (No NgModules)

**Status:** Accepted

**Context:** Angular 14+ supports standalone components that don't need to be declared in an `NgModule`.

**Decision:** Use standalone components everywhere. The `app.config.ts` provides application-wide providers. Routes use `loadComponent` for lazy loading.

**Alternatives considered:**
1. **Feature modules with NgModules** — Traditional Angular. Adds boilerplate (declare, import, export).
2. **NgModule per page** — Lots of files for each module.
3. **Standalone (chosen)** — Minimal boilerplate, better tree-shaking, natural lazy loading.

**Consequences:**
- ✅ No `app.module.ts` — configuration is in `app.config.ts` and is cleaner.
- ✅ Components declare their own imports, making dependencies explicit.
- ✅ Lazy loading via `loadComponent()` is trivial.
- ❌ Some older Angular ecosystem tools/tutorials assume NgModules.

---

## 8. Backend Proxy via Angular Dev Server

**Status:** Accepted

**Context:** During development, the Angular dev server runs on port 4200 and the NestJS API on port 3000. We need to avoid CORS issues.

**Decision:** Use the Angular CLI's built-in proxy support. The frontend calls `/api/*` which the dev server proxies to `http://localhost:3000/api/*`. No CORS configuration needed.

**Alternatives considered:**
1. **CORS headers** — Configure NestJS with `@nestjs/platform-express` CORS middleware. Works but requires configuring allowed origins in code.
2. **Nginx reverse proxy** — Better for production but overkill for development.
3. **Same port** — Serve Angular built files from NestJS. Works for production but loses HMR (hot module replacement).

**Consequences:**
- ✅ Simple: just add `proxyConfig` to `angular.json` or a `proxy.conf.json` file.
- ✅ No CORS headers needed in development.
- ✅ HMR works because Angular dev server handles it directly.
- ❌ Production deployment needs a reverse proxy or the NestJS `ServeStaticModule` to serve built Angular files.

---

## 9. Seed Data as OnModuleInit Hook

**Status:** Accepted

**Context:** We need demo data for development and evaluation.

**Decision:** Implement `SeedService` implementing `OnModuleInit`. On application startup, check `Organization.count()`. If zero, seed the database with demo data.

**Alternatives considered:**
1. **Separate seed script** — Needs to be run manually. Easy to forget.
2. **SQL file import** — Hard to maintain. Doesn't use entities (bypasses validation).
3. **Migration with seed** — Seed data in migration files is unconventional and mixes schema/data concerns.
4. **Endpoint /seed** — Works but requires an HTTP call and would need auth guards.

**Consequences:**
- ✅ Zero-step setup — data is ready on first launch.
- ✅ Idempotent — only runs on empty database.
- ✅ Uses entity constructors and validation.
- ❌ Adding new seed data requires code changes.
- ❌ No way to re-seed without deleting the database file.

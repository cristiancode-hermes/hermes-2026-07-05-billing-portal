# Lessons Learned

A candid collection of insights, mistakes, and "I wish I'd known" moments from building the Subscription Billing Portal.

---

## 1. Subagent Delegation Works — But Handoffs Matter

The project was built by delegating work to specialized subagents (auth, plans, customers, subscriptions, invoices, dashboard, frontend pages). This approach was highly productive — multiple agents could work in parallel. However, we learned some hard lessons:

**What went well:**
- Each subagent had a tight, focused context (one module, one set of files).
- The coordinator could kick off independent work in parallel.
- Reuse patterns emerged naturally (e.g., one agent built `StatusPillComponent`, others consumed it).

**What went wrong:**
- **Inconsistent naming conventions** — One subagent used `customerId`, another used `clientId`. We caught it in review, but it cost time.
- **Duplicate effort** — Two subagents independently implemented search functionality (one in the customer service, another in the subscription list). We consolidated afterward.
- **Missing imports** — A subagent would add a component to a template but forget to import it in the standalone component's `imports` array.

**Lesson:** Define a shared "Conventions & Patterns" document before delegating. Include naming conventions, file structure, import patterns, and a component catalog.

---

## 2. Proration Logic is Deceptively Complex

Proration looks simple on paper: `proportion = remainingDays / totalDays; adjustment = newPrice × proportion - oldPrice × proportion`. In practice:

**Edge cases we encountered:**
- **Leap years** — February has 28 or 29 days. A monthly subscription starting January 31 would have a different `totalDays` than one starting February 1. Our day-count calculation is naive (`getTime() / 86400000`) and treats all days as equal, which means a 365-day year always has 365 days. This is fine for most billing scenarios but not perfectly precise.
- **Same-day plan change** — If a customer changes plans on the same day the subscription starts, `daysElapsed = 0`, `remainingDays = daysInPeriod`, and the proration effectively charges the full new plan and credits the full old plan. This is correct but surprised us during testing.
- **Zero or negative periods** — If `daysInPeriod` is 0 (shouldn't happen, but defensive coding matters), divide-by-zero. We added a `Math.max(1, daysInPeriod)` guard.
- **Floating point** — Currency amounts with proration produce numbers like `10.450000000000001`. We use `Math.round(amount * 100) / 100` to keep things sane.

**Lesson:** Write a proration test matrix with at least 12 scenarios before shipping. Include: same-day change, last-day change, switching from yearly to monthly, leap year periods, and $0 adjustment cases.

---

## 3. Multi-step Wizard Complexity Grows Exponentially

The invoice creation wizard (4 steps: Customer → Items → Preview → Confirm) seemed straightforward but had hidden complexity:

- **State orchestration** — Each step has its own validation (`canProceed()` switches on `currentStep()`). Step 1 validates customer selection, Step 2 validates line items are non-empty with valid data, Step 3 validates due date. The wizard must prevent "Next" when validation fails.
- **Back-navigation state preservation** — Going back from Preview to Items must preserve all line items, quantities, and prices. Using signals for state means this is automatic — the data signal persists across step changes.
- **Step indicator UI** — The visual step indicator (numbered circles with connecting lines) needs 4 visual states: current (highlighted), completed (green checkmark), future (dimmed), and skipped (shouldn't happen, but guard against it).
- **Preview accuracy** — The preview step must mirror the final invoice exactly. We learned to use a `computed()` for derived values (subtotal, tax, total) instead of recalculating manually at each step, which had drifted.

**Lesson:** For multi-step wizards, invest in the step navigation logic early. Make `canProceed()` a `computed()` that reacts to state changes. Test all navigation paths: forward, backward, step-skip (if allowed), and edge cases like refreshing the browser mid-wizard.

---

## 4. Multi-tenant Scope Is a Cross-cutting Concern You Can't Forget

Every single query, every single create, every single update must filter by `organizationId`. We learned this the hard way when a subagent wrote:

```typescript
// BUG: No organizationId filter
const customer = await this.customerRepository.findOne({
  where: { id: dto.customerId },
});
```

This would have allowed Tenant A to create a subscription using Tenant B's customer. The fix was adding `.andWhere({ organizationId })` on every query.

**Our mitigation:**
- The `@CurrentUser()` decorator always returns the JWT payload with `organizationId`.
- Every service method accepts `organizationId` as its first parameter.
- We added a comment in every service: `// All queries filtered by organizationId`.
- TypeORM's `find()` without a `where` clause would return ALL rows — we catch this in code review.

**Lesson:** Multi-tenant isolation is not something you add later — it must be designed from the first query. Consider using TypeORM's `@Check()` decorator for a database-level constraint, or a repository-level interceptor that always appends `organizationId` to queries.

---

## 5. SQLite <-> PostgreSQL Compatibility Requires Constant Vigilance

We designed for both SQLite (dev) and PostgreSQL (production), but subtle differences kept surfacing:

- **Date handling** — SQLite's `datetime` type stores as text. Postgres has a native `timestamp`. We opted for ISO string dates everywhere (`startDate: string`) to be compatible, but this means we can't use SQL date functions in queries. Aggregation is done in TypeScript.
- **`simple-json`** — TypeORM stores this as a text column in SQLite and native `jsonb` in PostgreSQL. Both work, but querying inside JSON fields differs (SQLite `json_extract()` vs Postgres `->>` operator).
- **`boolean`** — SQLite stores 0/1 integers; Postgres stores true/false. TypeORM handles the translation, but raw queries need care.
- **`real` (SQLite) vs `double precision` (Postgres)** — SQLite's `real` is 8-byte IEEE floating point. Postgres's `real` is 4-byte. We should use `double precision` (mapped via `@Column('double')`) on Postgres for monetary values.
- **`synchronize: true`** — TypeORM's schema sync works beautifully with SQLite but is risky in production Postgres. For Postgres, we'd generate migrations.

**Lesson:** If you target two databases, use a compatibility layer. Either:
(a) Write all aggregation in application code (as we did), or
(b) Use an ORM query builder that abstracts SQL differences (TypeORM QueryBuilder mostly does this).

---

## 6. Angular's Zoneless Mode Changes How You Think About State

Zoneless change detection with signals is elegant but requires a mental shift:

**Old mental model (Zone.js):**
- Change a property → Zone.js intercepts the setter → marks the component and its ancestors as dirty → runs change detection on the next VM turn.

**New mental model (Signals):**
- Change a signal → Angular records which components read that signal in their template → those components re-render synchronously.

**Surprises we hit:**
- **`setTimeout()` doesn't trigger updates** — When testing, a plain `setTimeout(() => { this.loading = true; }, 1000)` didn't update the template. We use `setTimeout(() => this.loading.set(true), 1000)` instead.
- **External libraries** — A drag-and-drop library modified DOM state without going through signals. We had to call `ChangeDetectorRef.detectChanges()` after the library callback.
- **`effect()` cleanup** — `effect()` must be registered in an injection context (constructor or `inject()`). Using it in `ngOnInit` would work but manual cleanup is needed.
- **Testing** — `fixture.detectChanges()` still works. But we found `fixture.whenStable()` is unreliable without Zone.js. We use `fixture.detectChanges()` + `await fixture.whenRenderingDone()` instead.

**Lesson:** Zoneless is worth it (smaller bundle, more predictable), but budget time for the learning curve. Write a "Zoneless Gotchas" guide for your team.

---

## 7. Seed Data is a Double-edged Sword

The automatic seed (`SeedService.onModuleInit()`) was great for demos and development — data was ready immediately. But:

**Problems:**
- **No way to re-seed** — The check `if (orgCount > 0) return` means the only way to re-seed is to delete the SQLite database file. This isn't obvious to new developers.
- **Seed data assumptions** — The seed assumes a clean database. If migrations modify the schema, the seed may insert data that violates new constraints.
- **Demo data pollution** — When testing a real scenario, the demo data is distracting. We added a "Clear all data" button in Settings (removed later because it wasn't in the MVP spec).
- **Slow first launch** — The seed inserts ~40 records across 9 tables. With more seed data planned (100+ customers, 50+ invoices), this could take seconds.

**What we'd do differently:**
- Make seeding explicit: `npm run seed` or a `/api/seed` endpoint (protected by admin role).
- Make seeding idempotent with upserts (check by email/invoice number, update if exists).
- Add a `--no-seed` environment variable for CI and clean-room testing.

---

## 8. Invoice Number Generation Needs a Real Strategy

We generate invoice numbers as:

```typescript
const invoiceNumber = `INV-${today.getTime()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
```

This produces something like `INV-1743868800000-X7K9`. It's:
- ✅ Unique (timestamp + random suffix)
- ✅ Human-readable
- ❌ **Not sequential** — Can't say "invoice #1042"
- ❌ **Not guaranteed unique** — `Math.random()` could theoretically collide (though in practice, with the timestamp prefix, it's effectively impossible)
- ❌ **Predictable-ish** — If you know when a customer signed up, you could guess nearby invoice numbers

**What we'd do in production:**
- Use a database sequence or auto-increment ID for sequential numbering.
- Format as `INV-{year}-{sequential:05d}` (e.g., `INV-2026-00042`).
- For distributed systems, use a Snowflake-style ID or ULID.

---

## 9. Edge Cases in Subscription Lifecycle Management

We discovered several edge cases during manual testing:

- **Cancelling an already-cancelled subscription** — Returns 400 "Already cancelled". Good.
- **Reactivating an active subscription** — Returns 400 "Already active". Good.
- **Changing plan to the same plan** — Returns 400 "New plan must be different". Good.
- **Changing plan on a cancelled subscription** — Returns 400 "Cannot change plan on a cancelled subscription". Good.
- **Deleting a plan with active subscriptions** — Returns 409 "Cannot delete plan with active subscriptions". Good.
- **Subscribing to an inactive plan** — The API doesn't check `plan.isActive`. It should, unless we want to allow legacy subscription continuation.
- **Reactivating without a valid plan** — The service checks that the subscription's plan still exists. But what if the plan was deactivated? Currently, reactivation works even if the plan is inactive.

**Lesson:** Map out all lifecycle state transitions before coding. A state machine diagram (like we drew for invoices) would have caught the missing `plan.isActive` check for subscriptions.

---

## 10. Dark Mode: Simple Concept, Detailed Implementation

Dark mode seemed like a 15-minute task. It took longer because:

- **Color contrast** — Not all colors invert equally. The secondary color palette inverts completely (light becomes dark, dark becomes light), but primary and accent colors stay the same. Finding the right balance took iteration.
- **SVG icons** — Inline SVGs in navigation items needed `currentColor` to inherit the text color. Hardcoded `fill`/`stroke` values would break in dark mode.
- **Form inputs** — `<input>` and `<select>` elements need explicit dark mode styles (background, text, border, focus ring). Tailwind's `dark:` variant handles this, but we had to audit every form field.
- **Transition flash** — On page load, the theme is applied in the Angular service constructor. But there's a brief flash of light-mode content before Angular bootstraps. We added an inline `<script>` in `index.html` to check `localStorage` and apply the class before Angular loads.

**Lesson:** Dark mode is not just `filter: invert()`. It's a design system decision that affects every component. Start with a comprehensive color palette including dark variants, then apply systematically.

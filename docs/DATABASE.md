# Database Schema

## Entity Relationship Diagram

```mermaid
erDiagram
    Organization ||--o{ User : "has"
    Organization ||--o{ Plan : "has"
    Organization ||--o{ Customer : "has"
    Organization ||--o{ Subscription : "has"
    Organization ||--o{ Invoice : "has"
    Organization ||--o{ Payment : "has"
    Organization ||--|| Settings : "configures"

    Customer ||--o{ Subscription : "subscribes"
    Plan ||--o{ Subscription : "defines"

    Subscription ||--o{ Invoice : "generates"
    Invoice ||--o{ InvoiceItem : "contains"
    Invoice ||--o{ Payment : "has"

    Organization {
        uuid id PK
        text name
        text email
        datetime createdAt
        datetime updatedAt
    }

    User {
        uuid id PK
        text organizationId FK
        text email UK
        text passwordHash
        text name
        text role "admin | viewer"
        datetime createdAt
    }

    Plan {
        uuid id PK
        text organizationId FK
        text name
        text description "nullable"
        real price
        text cycle "monthly | yearly"
        simple-json features "nullable"
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Customer {
        uuid id PK
        text organizationId FK
        text name
        text email
        text phone "nullable"
        text company "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Subscription {
        uuid id PK
        text organizationId FK
        text customerId FK
        text planId FK
        text status "active | cancelled"
        text startDate
        text endDate "nullable"
        datetime cancelledAt "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Invoice {
        uuid id PK
        text organizationId FK
        text customerId FK
        text subscriptionId FK "nullable"
        text invoiceNumber UK
        text status "draft | sent | paid | overdue | cancelled"
        real subtotal
        real tax "nullable"
        real total
        text issueDate
        text dueDate "nullable"
        datetime paidAt "nullable"
        datetime sentAt "nullable"
        datetime createdAt
        datetime updatedAt
    }

    InvoiceItem {
        uuid id PK
        text invoiceId FK
        text description
        int quantity
        real unitPrice
        real total
        int sortOrder
    }

    Payment {
        uuid id PK
        text invoiceId FK
        text organizationId FK
        text method "transfer | card | cash"
        real amount
        text reference "nullable"
        text paymentDate
        datetime createdAt
    }

    Settings {
        uuid id PK
        text organizationId UK FK
        text currency "default: USD"
        real defaultTaxRate "default: 0"
        datetime updatedAt
    }
```

## Table Details

### `organizations`
The root tenant entity. Created during registration. Every other entity references it via `organizationId`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK, auto-generated) | |
| `name` | `text` | Organization name (e.g. "Acme SaaS") |
| `email` | `text` | Contact email |
| `createdAt` | `datetime` | Default: `CURRENT_TIMESTAMP` |
| `updatedAt` | `datetime` | Default: `CURRENT_TIMESTAMP` |

### `users`
User accounts scoped to an organization. Passwords hashed with bcrypt (10 rounds).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `organizationId` | `text` (FK → organizations) | |
| `email` | `text` (UNIQUE) | Login identifier |
| `passwordHash` | `text` | bcrypt hash |
| `name` | `text` | Display name |
| `role` | `text` | `admin` or `viewer`, default `viewer` |
| `createdAt` | `datetime` | |

### `plans`
Billing plans/skus offered by an organization.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `organizationId` | `text` (FK) | |
| `name` | `text` | e.g. "Basic", "Pro" |
| `description` | `text?` | |
| `price` | `real` | In organization's currency |
| `cycle` | `text` | `monthly` or `yearly` |
| `features` | `simple-json` | Arbitrary JSON (e.g. `{ features: ["5 users", ...] }`) |
| `isActive` | `boolean` | Default: `true`. Inactive plans hidden from new subscriptions |
| `createdAt` | `datetime` | |
| `updatedAt` | `datetime` | |

### `customers`
End customers (the people/companies who subscribe to plans).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `organizationId` | `text` (FK) | |
| `name` | `text` | |
| `email` | `text` | |
| `phone` | `text?` | |
| `company` | `text?` | |
| `createdAt` | `datetime` | |
| `updatedAt` | `datetime` | |

### `subscriptions`
Links a customer to a plan with lifecycle tracking.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `organizationId` | `text` (FK) | |
| `customerId` | `text` (FK → customers) | |
| `planId` | `text` (FK → plans) | |
| `status` | `text` | `active` or `cancelled` |
| `startDate` | `text` (ISO date) | When the subscription started/re-started |
| `endDate` | `text?` (ISO date) | When it ends (null if indefinite) |
| `cancelledAt` | `datetime?` | When cancellation was requested |
| `createdAt` | `datetime` | |
| `updatedAt` | `datetime` | |

**Status values:** `active`, `cancelled`

### `invoices`
Financial documents representing charges.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `organizationId` | `text` (FK) | |
| `customerId` | `text` (FK) | |
| `subscriptionId` | `text?` (FK) | Null for manual/standalone invoices |
| `invoiceNumber` | `text` (UNIQUE) | Auto-generated: `INV-{timestamp}-{random}` |
| `status` | `text` | `draft`, `sent`, `paid`, `overdue`, `cancelled` |
| `subtotal` | `real` | Sum of line items before tax |
| `tax` | `real?` | Calculated from subtotal × taxRate/100 |
| `total` | `real` | subtotal + tax |
| `issueDate` | `text` (ISO date) | |
| `dueDate` | `text?` (ISO date) | Default: issueDate + 30 days |
| `paidAt` | `datetime?` | Timestamp of payment |
| `sentAt` | `datetime?` | Timestamp when marked sent |
| `createdAt` | `datetime` | |
| `updatedAt` | `datetime` | |

### `invoice_items`
Line items belonging to an invoice. Cascades on invoice delete.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `invoiceId` | `text` (FK → invoices, ON DELETE CASCADE) | |
| `description` | `text` | e.g. "Consulting services" |
| `quantity` | `int` | |
| `unitPrice` | `real` | |
| `total` | `real` | quantity × unitPrice |
| `sortOrder` | `int` | Display ordering |

### `payments`
Payment records linked to invoices.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `invoiceId` | `text` (FK → invoices) | |
| `organizationId` | `text` (FK) | |
| `method` | `text` | `transfer`, `card`, or `cash` |
| `amount` | `real` | |
| `reference` | `text?` | External reference (e.g. transaction ID) |
| `paymentDate` | `text` (ISO date) | |
| `createdAt` | `datetime` | |

### `settings`
One-to-one with organizations. Stores billing configuration.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `organizationId` | `text` (UNIQUE FK) | Unique index ensures 1:1 |
| `currency` | `text` | Default: `USD` |
| `defaultTaxRate` | `real` | Default: `0` (0%) |
| `updatedAt` | `datetime` | |

---

## Migration Strategy

### Development (`synchronize: true`)
```typescript
// app.module.ts
TypeOrmModule.forRoot({
  type: 'better-sqlite3',
  database: 'data/billing.sqlite',
  autoLoadEntities: true,
  synchronize: true,  // Auto-creates/updates tables on every launch
})
```

TypeORM's `synchronize: true` generates `CREATE TABLE` / `ALTER TABLE` statements on application bootstrap based on your entity decorators. This is ideal for rapid prototyping.

**Trade-offs:**
- ✅ No migration files to manage
- ✅ Always in sync with entity code
- ❌ Destructive in production (could drop columns/data)
- ❌ No audit trail of schema changes

### Production (NestJS + Neon PostgreSQL)
For production, disable `synchronize` and use TypeORM migrations:

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  autoLoadEntities: true,
  synchronize: false,
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
})
```

Generate a migration:
```bash
npx typeorm migration:generate src/migrations/AddTaxRate -d src/ormconfig.ts
```

---

## Neon-specific Choices

The schema is deliberately **PostgreSQL-compatible**:

- **UUID primary keys** — `@PrimaryGeneratedColumn('uuid')` works natively in PostgreSQL with `gen_random_uuid()`. SQLite stores them as text, which is fine.
- **`text` type** for dates — Using ISO 8601 strings instead of native `DATE`/`TIMESTAMP` columns ensures portability between SQLite (which lacks a true date type) and PostgreSQL.
- **`real`** for monetary amounts — Works in both databases. For production, consider `numeric(12,2)` in PostgreSQL for precise currency math.
- **`simple-json`** — TypeORM stores this as a JSON string in SQLite and native `jsonb` in PostgreSQL.
- **`boolean`** — SQLite stores as integers (0/1), PostgreSQL as native boolean. TypeORM handles the translation.
- **No SQLite-specific features** — No `AUTOINCREMENT`, no window functions used in queries. All aggregation is done in application code.

To switch to Neon:
1. Install `pg` (PostgreSQL driver) and `@nestjs/typeorm` — already compatible.
2. Update TypeORM config in `app.module.ts` to use `type: 'postgres'` and `url: process.env.DATABASE_URL`.
3. Set `synchronize: false` and run TypeORM migrations.
4. Create the database on Neon and run the initial migration.

---

## Aggregation Queries

### MRR (Monthly Recurring Revenue)
Calculated in application code, not SQL. Active subscriptions are loaded with their plan relation, and MRR is summed as:

```typescript
// DashboardService.getKpis()
const mrr = activeSubs.reduce((sum, sub) => {
  if (sub.plan?.cycle === 'yearly') {
    return sum + (sub.plan.price || 0) / 12;
  }
  return sum + (sub.plan?.price || 0);
}, 0);
```

### Churn Rate
Simple ratio of cancelled to total subscriptions:

```typescript
const churnRate = totalSubs > 0 ? (cancelledSubs / totalSubs) * 100 : 0;
```

### Monthly Revenue (12-month chart)
Uses TypeORM QueryBuilder per month:

```typescript
// DashboardService.getRevenueChart()
for each of the last 12 months:
  const result = await invoiceRepository.createQueryBuilder('invoice')
    .select('COALESCE(SUM(invoice.total), 0)', 'revenue')
    .where('invoice.organizationId = :orgId')
    .andWhere('invoice.status = :status', { status: 'paid' })
    .andWhere('invoice.paidAt >= :start')
    .andWhere('invoice.paidAt <= :end')
    .getRawOne();
```

In production with PostgreSQL, this could be optimized to a single query:

```sql
SELECT
  strftime('%Y-%m', paidAt) AS month,
  COALESCE(SUM(total), 0) AS revenue
FROM invoices
WHERE organizationId = :orgId
  AND status = 'paid'
  AND paidAt >= date('now', '-12 months')
GROUP BY strftime('%Y-%m', paidAt)
ORDER BY month ASC;
```

(Note: `strftime` is SQLite syntax. PostgreSQL would use `to_char(paidAt, 'YYYY-MM')`.)

# Subscription Billing Portal

> **Multi-tenant SaaS subscription management with invoicing, plan lifecycle, and KPI dashboards.**

---

## Features

### MVP (Implemented)
- **Multi-tenant JWT Auth** — Registration creates an organization with auto-provisioned settings. Login returns a signed JWT (7-day expiry). Role support: `admin` / `viewer`.
- **Plan CRUD** — Create, update, delete billing plans with monthly or yearly cycles, price, features JSON, and active/inactive toggle. Plans with active subscriptions cannot be deleted.
- **Customer Management** — Full CRUD with name, email, phone, company. Search by name with `LIKE` query, paginated results (default 10 per page).
- **Subscription Lifecycle** — Create subscriptions (customer + plan → auto-generates first draft invoice), cancel, reactivate, change plan with proration. All operations scoped to the user's organization.
- **Proration on Plan Change** — Day-weighted proration: credit remaining value on current plan, charge proportional value on new plan. Adjustment invoice (credit or charge) is auto-generated.
- **Invoice Status Machine** — `draft → sent → paid` (with payment recording) or `sent → overdue` or `draft/cancelled` cancel. Guards prevent invalid transitions.
- **Multi-step Invoice Wizard** — 4-step UI: Customer → Line Items → Preview → Confirm. Dynamic line items with auto-calculated totals.
- **Dashboard KPIs** — MRR (monthly recurring revenue, annual plans normalized ÷12), active subscriptions count, total revenue (sum of paid invoices), churn rate (cancelled / total × 100), 12-month revenue bar chart, overdue invoices list with quick "Mark Paid" action.
- **Dark Mode** — System preference detected on load, manual toggle persisted to `localStorage`, Tailwind `dark:` variant with inverted secondary color palette.
- **Responsive Sidebar Layout** — Collapsible sidebar with mobile overlay, 6 navigation items (Dashboard, Plans, Customers, Subscriptions, Invoices, Settings).
- **Seed Data** — On first launch, auto-seeds 1 org, 2 users, 3 plans, 5 customers, 8 subscriptions (mix active/cancelled), 14 invoices (mix statuses), 3 payments.

### Planned / Roadmap
- Email notifications for invoice send/overdue
- Payment gateway integration (Stripe)
- Webhook support for external systems
- Role-based access control (fine-grained permissions)
- Bulk subscription operations
- Recurring invoice auto-generation
- Multi-currency support
- Usage-based billing (metered subscriptions)
- API rate limiting and audit logging
- Export (CSV/PDF) for invoices and reports

---

## Full Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 22 (standalone components, zoneless change detection, signals) |
| **Styling** | Tailwind CSS 4 with custom theme (primary, secondary, accent, warning, danger) |
| **Backend** | NestJS 11, Passport JWT auth, class-validator DTOs |
| **Database** | TypeORM with `better-sqlite3` (dev) — PostgreSQL-compatible schema for production on Neon |
| **API Docs** | Swagger / OpenAPI via `@nestjs/swagger` |
| **Build** | Angular CLI 22, NestJS CLI |
| **Testing** | Jasmine (Angular), Jest (NestJS) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Angular 22)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Auth    │  │  Pages   │  │ Services │  │ Shared  │ │
│  │ (Login/  │  │ (12 lazy │  │ (HTTP    │  │ (16     │ │
│  │ Register)│  │  routes) │  │  calls)  │  │  comps) │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                     │ proxy /api/*                       │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────┐
│              NestJS API Server                           │
│  ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────────┐  │
│  │  Auth  │ │Plans │ │Cust. │ │Subs  │ │  Invoices  │  │
│  │  JWT   │ │ CRUD │ │ CRUD │ │Life- │ │  Status    │  │
│  │        │ │      │ │+Srch │ │cycle │ │  Machine   │  │
│  └────────┘ └──────┘ └──────┘ └──────┘ └────────────┘  │
│  ┌────────┐ ┌──────────┐ ┌────────┐                     │
│  │Dashboard│ │ Settings │ │  Seed  │                     │
│  │  KPIs   │ │  Org     │ │  Demo  │                     │
│  │  Chart  │ │  Config  │ │  Data  │                     │
│  └────────┘ └──────────┘ └────────┘                     │
│                    │ TypeORM                             │
└────────────────────┼───────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │   SQLite / Neon PG  │
          │   9 entities        │
          │   synchronize=true  │
          └─────────────────────┘
```

Every request passes through `JwtAuthGuard`, which extracts `organizationId` from the JWT payload. All service methods filter by `organizationId`, providing row-level multi-tenant isolation without separate databases.

---

## Prerequisites

- **Node.js 22+** (LTS recommended)
- **npm** (comes with Node)
- **Git**

---

## Local Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd billing-portal

# 2. Backend — install dependencies & build
cd apps/api
npm install
npm run build

# 3. Frontend — install dependencies & build
cd ../web
npm install
ng build

# 4. Configure environment
# Copy and edit .env for the API:
cp ../../.env.example apps/api/.env
# Edit apps/api/.env with your JWT_SECRET (or use the dev default)

# 5. Start the backend
cd ../api
npm start

# 6. In another terminal, start the frontend dev server
cd ../web
ng serve
```

The API runs on `http://localhost:3000` (Swagger at `/api/docs`).  
The frontend runs on `http://localhost:4200` (proxies `/api` to the backend).

### Using the seed data

On first launch, the API automatically seeds demo data:
- **Login:** `admin@acme.com` / `password123`
- **Viewer:** `viewer@acme.com` / `password123`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `3000` | Backend listen port |
| `API_PREFIX` | `api` | Global route prefix |
| `JWT_SECRET` | `dev-secret` | HMAC secret for JWT signing |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `DATABASE_PATH` | `data/billing.sqlite` | SQLite database file path |

For production on Neon (PostgreSQL), uncomment `DATABASE_URL` in `.env`.

---

## Project Structure

```
billing-portal/
├── apps/
│   ├── api/                    # NestJS backend
│   │   └── src/
│   │       ├── auth/           # Auth module (register, login, JWT strategy)
│   │       ├── plans/          # Plans module
│   │       ├── customers/      # Customers module with search/pagination
│   │       ├── subscriptions/  # Subscription lifecycle + proration
│   │       ├── invoices/       # Invoice status machine + payments
│   │       ├── dashboard/      # KPI aggregation queries
│   │       ├── settings/       # Organization settings (currency, tax rate)
│   │       ├── seed/           # Automatic seed data on first launch
│   │       └── entities/       # 9 TypeORM entities
│   └── web/                    # Angular 22 frontend
│       └── src/app/
│           ├── pages/          # 12 lazy-loaded page components
│           ├── layouts/        # MainLayout (sidebar + header)
│           ├── services/       # 7 HTTP service classes
│           ├── models/         # TypeScript interfaces
│           └── shared/         # 12 reusable components
└── docs/                       # Documentation
```

---

## Topics

`angular` `nestjs` `typeorm` `sqlite` `tailwindcss` `saas` `billing` `subscriptions` `multi-tenant` `jwt` `proration` `invoicing`

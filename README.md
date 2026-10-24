# PFMP — Personal and Family Management Platform

Phase 1+2 monorepo ([`mostafatoloo/pfmp`](https://github.com/mostafatoloo/pfmp)). **Microsoft SQL Server only** (no PostgreSQL).

**Status:** Phase 2 implemented for review — see [`docs/phase-2-completion-report.md`](./docs/phase-2-completion-report.md). **Stop before Phase 3.**

Docs index: [`docs/README.md`](./docs/README.md)  
Completion report (Context): `docs/phase-1-completion-report.md`

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js (App Router) + React + TypeScript |
| Worker | Node job runner (`apps/worker`) — Playwright PDF |
| Monorepo | pnpm workspaces + Turborepo |
| DB | Microsoft SQL Server 2022 + **Prisma 7** (`provider = "sqlserver"`) |
| Auth | **Better Auth** — magic link + optional WebAuthn/passkeys |
| Validation | Zod (`@pfmp/validation`, `@pfmp/api-contracts`) |

## Quick start

```bash
cp .env.example .env
# Edit BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose -f infra/docker/docker-compose.yml up -d
pnpm install
pnpm db:ensure && pnpm db:generate && pnpm db:migrate
DATABASE_URL="$TEST_DATABASE_URL" pnpm db:migrate   # once for tests
pnpm dev
# → http://localhost:3000  (sign-in at /sign-in; magic link logged in dev)
```

Full local guide: [`docs/setup/local-development.md`](./docs/setup/local-development.md)  
Env reference: [`docs/setup/environment.md`](./docs/setup/environment.md)  
SQL Server: [`docs/setup/sql-server.md`](./docs/setup/sql-server.md)

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install workspace deps |
| `pnpm db:ensure` | Create `pfmp` / `pfmp_test` databases |
| `pnpm db:generate` | Prisma client generate |
| `pnpm db:migrate` | Apply migrations (`prisma migrate deploy`) |
| `pnpm db:migrate:dev` | Create/apply migrations in development |
| `pnpm db:backup-drill` | Backup → wipe → restore row-count check |
| `pnpm dev` | Next.js web on :3000 |
| `pnpm typecheck` | Typecheck packages/apps |
| `pnpm test:unit` | Unit tests (Vitest) |
| `pnpm test:integration` | SQL Server integration tests |
| `pnpm test:e2e` | Playwright smoke (build web first) |
| `pnpm build` | Build all packages + web |

## Packages

```
apps/web           Next.js UI + /api/auth/* + /api/v1/*
apps/worker        Job runner (exports, notification stub, AI job ack)
packages/database  Prisma schema, migrations, domain services
packages/auth      Better Auth, requireWorkspace(), magic link + passkey
packages/api-contracts  Zod envelopes / error codes
packages/validation     Shared Zod primitives
packages/domain         Pure domain rules (no I/O)
packages/ui             App shell / nav
packages/calendar       Jalali display
packages/export-engine  CSV/XLSX/JSON/HTML + pdf-chromium (worker)
packages/ai-gateway     Stub gateway (AI off by default)
infra/docker            SQL Server Compose
docs/                   Setup, architecture, testing, limitations
```

## Auth (short)

- Magic link: `POST /api/auth/sign-in/magic-link` — logged in dev without email provider
- Passkeys: when `PASSKEY_ENABLED=true`; otherwise magic link
- Personal workspace created on user create
- Authz: `requireWorkspace()` — never trust client `workspaceId`

Details: [`docs/architecture/auth-notes.md`](./docs/architecture/auth-notes.md), [`docs/security/README.md`](./docs/security/README.md)

## Phase 1 modules (Stage 4)

Tasks, projects/activities, academic, deterministic planning, time/Pomodoro, progress, calendar/Jalali, exports, notifications foundation, limited AI schedule proposals (accept/reject; AI off → `AI_UNAVAILABLE`).

## Out of scope

Family collaboration, meals, Telegram, full conversational AI, offline-first, native apps, invoicing — see [`docs/phase-2-recommendations.md`](./docs/phase-2-recommendations.md) (**notes only**).

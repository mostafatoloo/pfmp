# PFMP — Personal and Family Management Platform

Phase 1 greenfield monorepo (`mostafatoloo/pfmp`). **Microsoft SQL Server only** (no PostgreSQL). Stage 3 foundation: config, migrations, Better Auth (magic link + passkey scaffolding), personal workspace, base UI shell, SQL Server–backed isolation tests.

Architecture decisions live in the Project store and are mirrored under [`docs/`](./docs/).

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js (App Router) + React + TypeScript |
| Monorepo | pnpm workspaces + Turborepo |
| DB | Microsoft SQL Server 2022 + **Prisma 7** (`provider = "sqlserver"`) |
| Auth | **Better Auth** — email magic link; WebAuthn/passkeys when enabled |
| Validation | Zod (`@pfmp/validation`, `@pfmp/api-contracts`) |

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io) 10+
- Docker (for SQL Server)

## Quick start

```bash
# 1) SQL Server
cp .env.example .env
# Edit BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose -f infra/docker/docker-compose.yml up -d

# Create app databases (once)
docker exec pfmp-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Your_strong_Password123' -C \
  -Q "IF DB_ID('pfmp') IS NULL CREATE DATABASE pfmp; IF DB_ID('pfmp_test') IS NULL CREATE DATABASE pfmp_test;"

# 2) Install & migrate
pnpm install
pnpm db:generate
pnpm db:migrate

# 3) Dev server
pnpm dev
# → http://localhost:3000 (redirects to /today; sign-in at /sign-in)
```

### Without Docker

Install SQL Server 2019/2022 or Azure SQL, set `DATABASE_URL` in `.env` to a JDBC-style Prisma URL:

```text
sqlserver://HOST:1433;database=pfmp;user=USER;password=PASSWORD;encrypt=true;trustServerCertificate=true
```

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install workspace deps |
| `pnpm db:generate` | Prisma client generate |
| `pnpm db:migrate` | Apply migrations (`prisma migrate deploy`) |
| `pnpm db:migrate:dev` | Create/apply migrations in development |
| `pnpm dev` | Next.js web on :3000 |
| `pnpm typecheck` | Typecheck packages/apps |
| `pnpm test:unit` | Unit tests (Vitest) |
| `pnpm test:integration` | SQL Server integration tests (requires DB) |
| `pnpm build` | Build all packages + web |

## Packages

```
apps/web          Next.js UI + `/api/auth/*` + `/api/v1/*`
apps/worker       Job runner stub (Stage 4)
packages/database Prisma schema, migrations, WorkspaceRepository
packages/auth     Better Auth config, requireWorkspace(), magic link + passkey
packages/api-contracts  Zod envelopes / error codes
packages/validation     Shared Zod primitives
packages/domain         Pure domain rules (no I/O)
packages/ui             App shell / nav
packages/calendar       Jalali display stub
packages/export-engine  Export stub
packages/ai-gateway     AI off-by-default stub
infra/docker            SQL Server Compose
docs/                   In-repo architecture mirrors
```

## Auth notes

- **Magic link**: `POST /api/auth/sign-in/magic-link` — in development the link is logged (no email provider required).
- **Passkeys**: scaffolded via `@better-auth/passkey` when `PASSKEY_ENABLED=true`. If the browser lacks WebAuthn, use magic link.
- **Personal workspace**: created in Better Auth `user.create.after` hook.
- **Authz**: `requireWorkspace()` resolves the caller’s personal workspace; never trust client `workspaceId`.

See [`docs/architecture/auth-notes.md`](./docs/architecture/auth-notes.md).

## Tests

```bash
# Unit
pnpm test:unit

# Integration (SQL Server — uses DATABASE_URL or TEST_DATABASE_URL)
export TEST_DATABASE_URL="sqlserver://localhost:1433;database=pfmp_test;user=sa;password=Your_strong_Password123;encrypt=true;trustServerCertificate=true"
pnpm db:migrate   # ensure migrations applied to test DB too (point DATABASE_URL at pfmp_test once, or migrate both)
pnpm test:integration
```

Cross-user isolation: User A must not read User B workspace-scoped rows (`packages/database` + `apps/web` integration suites).

## Stage 3 vs Stage 4

Stage 3 delivers foundation only. Full tasks / study / timer / export / AI workflows are **not** implemented here beyond schema tables and stubs needed to compile and prove authz.

## Project docs (binding)

Store copies (Context): `phase-1-spec.md`, `architecture-overview.md`, `database-schema.md`, `architecture-decisions.md`, `api-and-contracts.md`, `test-strategy.md`.

# Architecture overview (Phase 1)

Modular monolith on TypeScript:

| App / package | Responsibility |
|---------------|----------------|
| `apps/web` | Next.js App Router UI + Better Auth routes + `/api/v1/*` |
| `apps/worker` | Claims SQL Server `Job` rows; injects Playwright PDF renderer |
| `packages/database` | Prisma 7 SQL Server schema, repositories, domain services |
| `packages/auth` | Better Auth config, `requireWorkspace()`, session helpers |
| `packages/domain` | Pure rules (planning constraints, status machines) |
| `packages/api-contracts` | Zod request/response envelopes + error codes |
| `packages/validation` | Shared Zod primitives |
| `packages/ui` | App shell / nav (RTL-ready) |
| `packages/calendar` | Jalali display helpers |
| `packages/export-engine` | CSV/XLSX/JSON/HTML PDF builders; `./pdf-chromium` subpath for worker only |
| `packages/ai-gateway` | Provider-independent stub; offline by default |

## Non-negotiable choices

- **Microsoft SQL Server** only (`provider = "sqlserver"`) — no PostgreSQL
- **Prisma 7** + `@prisma/adapter-mssql` (pin 7.x; Prisma 8 SQL Server not assumed)
- **Better Auth** magic link + optional passkeys
- **Workspace isolation**: every domain row scoped by `workspaceId`; Phase 1 = one personal workspace per user (`kind=personal`, `role=owner`)
- **Jobs**: SQL Server `Job` table + worker (no Redis required)
- **PDF**: Chromium via Playwright in the **worker**; never bundled into Next

## ADRs

Canonical ADRs: Project Context `architecture-decisions.md` (ADR-001 auth, ADR-002 Prisma/MSSQL, ADR-003 jobs, ADR-004 PDF, etc.).

In-repo notes: [auth-notes.md](./auth-notes.md), [database.md](./database.md), [../export/formats.md](../export/formats.md).

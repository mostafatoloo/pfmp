# Architecture overview (Stage 3 mirror)

Modular monolith:

- `apps/web` — Next.js UI + route handlers
- `apps/worker` — persistent jobs (stub in Stage 3)
- Packages: `domain`, `database`, `auth`, `api-contracts`, `validation`, `ui`, `export-engine`, `ai-gateway`, `calendar`

**Database:** Microsoft SQL Server + Prisma 7 (`provider = "sqlserver"`).  
**Auth:** Better Auth via Prisma adapter (`provider: "sqlserver"`).  
**Queue:** SQL Server `Job` table + worker (Stage 4).  
**No PostgreSQL. No Phase 2 family/Telegram/meal features.**

Workspace isolation: every domain row is scoped by `workspaceId`; Phase 1 users have exactly one personal workspace (`kind=personal`, member `role=owner`).

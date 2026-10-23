# Schema & database conventions

## Provider

Microsoft SQL Server (`dbo`). Prisma schema: `packages/database/prisma/schema.prisma`.

## Conventions

| Concern | Convention |
|---------|------------|
| Timestamps | `*AtUtc` as `datetime2(3)` UTC |
| Durations | `int` seconds (`durationSeconds`) |
| Soft delete | `deletedAtUtc` nullable; default lists filter null |
| JSON blobs | `nvarchar(max)` + Zod parse (Prisma `Json` unsupported on MSSQL) |
| Domain IDs | `uniqueidentifier` |
| Auth IDs | Better Auth string IDs (`user`, `session`, …) |

## Core domain groups (Phase 1)

- **Workspace** / `WorkspaceMember` — personal ownership boundary
- **Task** + `TaskHistory` — lifecycle; reschedule keeps `originalDueAtUtc`
- **Project** / `Activity`
- **Term** / `Course` / `Topic` / `Assessment` / topic progress measures
- **ScheduleVersion** / items — deterministic + AI-accepted versions
- **PlanProposal** — preview / accept / reject
- **TimeEntry** / `ActiveTimer` (≤1 active per workspace)
- **Pomodoro** config + sessions
- **ExportArtifact** + **Job**
- **Notification**

Detailed column-level design: Context store `database-schema.md`.

## Migrations

See [../setup/migrations.md](../setup/migrations.md). Clean-DB migrate is a Definition of Done gate.

# Migrations

Prisma Migrate owns schema changes (`packages/database/prisma`).

## Apply (deploy / CI / local)

```bash
pnpm db:generate
pnpm db:migrate          # prisma migrate deploy against DATABASE_URL
```

Point `DATABASE_URL` at `pfmp_test` (or use `TEST_DATABASE_URL`) and run migrate again so integration tests see the same schema.

## Develop new migrations

```bash
pnpm db:migrate:dev      # prisma migrate dev (interactive)
```

## Conventions (SQL Server)

- Domain IDs: `uniqueidentifier`
- Timestamps: `*AtUtc` as `datetime2(3)` UTC
- Soft delete: `deletedAtUtc`
- JSON payloads: `nvarchar(max)` + Zod (Prisma `Json` unsupported on MSSQL)
- Auth tables mapped for Better Auth (`user`, `session`, `account`, `verification`, `passkey`)

## Clean database gate

Definition of Done requires migrations apply on an empty SQL Server database — exercised in CI (`db:ensure` → `db:migrate` → integration).

Reset (destructive, local only):

```bash
pnpm --filter @pfmp/database migrate:reset
```

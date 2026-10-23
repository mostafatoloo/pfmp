# Database conventions

- Provider: SQL Server (`dbo`)
- Domain timestamps: `*AtUtc` as `datetime2(3)` UTC
- Durations: `int` seconds
- Soft delete: `deletedAtUtc` nullable; default queries filter null
- JSON blobs: `nvarchar(max)` + Zod (Prisma `Json` unsupported on SQL Server)
- IDs: `uniqueidentifier` for domain tables; Better Auth string IDs for auth tables

Migrations: Prisma Migrate from empty database is a Definition of Done gate.

```bash
pnpm db:migrate
```

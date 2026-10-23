# Backup / restore drill (SQL Server)

Stage 5 quality gate: prove we can backup and restore the Phase 1 database and recover row counts.

## Prerequisites

- Reachable SQL Server (local `pfmp-sqlserver` or CI service) — see `infra/docker/docker-compose.yml`
- Writable path **inside** the SQL Server host for `.bak` files

**Local Docker** (dedicated backup dir):

```bash
docker exec -u 0 pfmp-sqlserver mkdir -p /var/opt/mssql/backup
docker exec -u 0 pfmp-sqlserver chown mssql:mssql /var/opt/mssql/backup
```

**CI (GitHub Actions service container):** set `PFMP_BACKUP_DIR=/var/opt/mssql/data` (default when `CI=true`). No `docker exec` required.

## Run

```bash
# from repo root (uses mssql package)
pnpm db:backup-drill
```

Script: `scripts/backup-restore-drill.mjs`

What it does:

1. Ensures `DrillMarker` table + row in `pfmp`
2. Records row count
3. `BACKUP DATABASE` to `$PFMP_BACKUP_DIR/pfmp_stage5_drill.bak` (default `/var/opt/mssql/backup`, or `/var/opt/mssql/data` when `CI=true`)
4. Deletes marker rows
5. `RESTORE DATABASE … WITH REPLACE`
6. Asserts row count matches

Exit codes: `0` pass, `1` count mismatch, `2` backup path/permission failure.

## Azure SQL / production notes

Prefer automated PITR / geo-backup for hosted Azure SQL. This drill validates the **local Docker / CI service** path used in Phase 1.

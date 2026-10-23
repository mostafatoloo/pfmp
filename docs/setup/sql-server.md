# SQL Server setup

Phase 1 requires **Microsoft SQL Server** (2019/2022 or Azure SQL). PostgreSQL is not supported.

## Docker (recommended local)

```bash
docker compose -f infra/docker/docker-compose.yml up -d
# Wait until healthy: docker ps → pfmp-sqlserver
pnpm db:ensure   # creates pfmp + pfmp_test if missing
```

Default SA password (dev only): `Your_strong_Password123` — override with `MSSQL_SA_PASSWORD`.

Compose file: `infra/docker/docker-compose.yml`  
Image: `mcr.microsoft.com/mssql/server:2022-latest`  
Port: `1433`

## Connection URL (Prisma)

```text
sqlserver://HOST:1433;database=pfmp;user=sa;password=PASSWORD;encrypt=true;trustServerCertificate=true
```

For Azure SQL, prefer `encrypt=true` and appropriate trust settings for your CA.

## Databases

| Database | Use |
|----------|-----|
| `pfmp` | App / local dev |
| `pfmp_test` | Integration tests (`TEST_DATABASE_URL`) |

Create via `pnpm db:ensure` or:

```bash
docker exec pfmp-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C \
  -Q "IF DB_ID('pfmp') IS NULL CREATE DATABASE pfmp; IF DB_ID('pfmp_test') IS NULL CREATE DATABASE pfmp_test;"
```

## Backup directory (local drill)

```bash
docker exec -u 0 pfmp-sqlserver mkdir -p /var/opt/mssql/backup
docker exec -u 0 pfmp-sqlserver chown mssql:mssql /var/opt/mssql/backup
pnpm db:backup-drill
```

See [../testing/backup-restore.md](../testing/backup-restore.md).

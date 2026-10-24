# Test execution

Strategy binding: Project Context `test-strategy.md`.

| Layer | Tool | Command / location |
|-------|------|--------------------|
| Unit | Vitest | `pnpm test:unit` |
| Integration | Vitest + **real SQL Server** | `pnpm test:integration` |
| E2E smoke | Playwright | `pnpm --filter @pfmp/web build && pnpm test:e2e` |
| Backup drill | Node + T-SQL | `pnpm db:backup-drill` |

## Integration prerequisites

```bash
docker compose -f infra/docker/docker-compose.yml up -d
pnpm db:ensure && pnpm db:migrate
DATABASE_URL="$TEST_DATABASE_URL" pnpm db:migrate
export TEST_DATABASE_URL="sqlserver://localhost:1433;database=pfmp_test;user=sa;password=Your_strong_Password123;encrypt=true;trustServerCertificate=true"
# Optional for real PDF assertion:
pnpm --filter @pfmp/export-engine exec playwright install chromium
pnpm test:integration
```

SQLite / Postgres stand-ins are **forbidden** as the only persistence proof.

## E2E

See [e2e.md](./e2e.md). CI runs public smoke (no mailbox). Full auth journeys: `E2E_FULL=1`.

## Reports

- [phase-1-test-report.md](./phase-1-test-report.md)
- [backup-restore.md](./backup-restore.md)

Blocking gates: migration-from-clean, cross-user isolation, Stage 5 security critical paths.

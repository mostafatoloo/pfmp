# Deployment (Phase 1)

Phase 1 is a modular monolith: **Next.js web** + optional **Node worker** + **SQL Server**.

## Components

| Component | Role |
|-----------|------|
| `apps/web` | UI + `/api/auth/*` + `/api/v1/*` |
| `apps/worker` | Claims `Job` rows; Playwright PDF for `export.pdf` |
| SQL Server | Domain + auth + jobs |

Docker Compose currently publishes **SQL Server** for local/CI. Web/worker Dockerfiles can be added when hosting; until then run Node processes against managed Azure SQL (or equivalent).

## Suggested production checklist

1. Provision SQL Server / Azure SQL; set strong credentials; TLS encrypt.
2. Set secrets: `BETTER_AUTH_SECRET`, `DATABASE_URL`, `APP_URL`, `BETTER_AUTH_URL`.
3. Configure transactional email (`RESEND_API_KEY` / `EMAIL_FROM`) for magic links.
4. `pnpm db:migrate` against production DB (from CI or release job).
5. Build: `pnpm --filter @pfmp/web build` → run `next start`.
6. Run worker with Chromium available (`playwright install chromium`) unless `PFMP_PDF_HTML_ONLY=true`.
7. Enable PITR / automated backups on the hosted database (local `.bak` drill is for Docker/dev — see [../testing/backup-restore.md](../testing/backup-restore.md)).
8. Keep `AI_ENABLED=false` until a real provider key and review process exist.

## CI

GitHub Actions (`.github/workflows/ci.yml`):

- **unit** — Vitest without live DB
- **integration** — SQL Server service, migrations, Vitest, backup drill, Playwright Chromium for PDF path
- **e2e** — build web, Playwright smoke against `next start`

## Out of scope

Blue/green, multi-region, Kubernetes operators, and family/multi-tenant admin are Phase 2+ decisions — see [../phase-2-recommendations.md](../phase-2-recommendations.md).

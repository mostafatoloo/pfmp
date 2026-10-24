# Local development

## Prerequisites

- Node.js 22+
- pnpm 10+ (`packageManager` in root `package.json`)
- Docker (SQL Server) or a reachable SQL Server instance

## First-time setup

```bash
cp .env.example .env
# Set BETTER_AUTH_SECRET
docker compose -f infra/docker/docker-compose.yml up -d
pnpm install
pnpm db:ensure
pnpm db:generate
pnpm db:migrate
# Also migrate test DB once:
DATABASE_URL="$TEST_DATABASE_URL" pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000` → redirects to `/today` (auth required) or `/sign-in`.

## Magic link (dev)

1. Enter email on `/sign-in`
2. Server logs the magic-link URL when `RESEND_API_KEY` is unset
3. Open the URL → session cookie → personal workspace available

## Worker (exports / jobs)

In a second terminal (after migrations):

```bash
pnpm --filter @pfmp/worker exec tsx src/index.ts
# Optional: install Chromium once for real PDF
pnpm --filter @pfmp/export-engine exec playwright install chromium
```

Without Playwright, PDF jobs store A4 RTL HTML (print-ready). Set `PFMP_PDF_HTML_ONLY=true` to force that path.

## Useful scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Next.js on :3000 |
| `pnpm build` | Build packages + web |
| `pnpm typecheck` | Typecheck workspace |
| `pnpm test:unit` | Unit tests |
| `pnpm test:integration` | SQL Server integration |
| `pnpm test:e2e` | Playwright (build first) |
| `pnpm db:backup-drill` | Backup/restore smoke |

See root [README.md](../../README.md).

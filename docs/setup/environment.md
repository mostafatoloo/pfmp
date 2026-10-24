# Environment reference

Copy `.env.example` → `.env`. Never commit secrets.

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_URL` | yes | Public app origin (e.g. `http://localhost:3000`) |
| `DATABASE_URL` | yes | Prisma SQL Server URL for app DB |
| `TEST_DATABASE_URL` | tests | Integration-test DB URL |
| `BETTER_AUTH_SECRET` | yes | ≥32 chars; `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | yes | Auth base URL (usually same as `APP_URL`) |
| `AI_ENABLED` | no | `true` / `false` (default off) |
| `PASSKEY_ENABLED` | no | Enable WebAuthn plugin (default `true` in example) |
| `PASSKEY_RP_ID` | no | Relying party id (default `localhost`) |
| `PASSKEY_RP_NAME` | no | Display name (default `PFMP`) |
| `RESEND_API_KEY` | no | If unset, magic links are **logged** in development |
| `EMAIL_FROM` | no | From address when email provider configured |
| `MSSQL_SA_PASSWORD` | docker | SA password for Compose / drill |
| `MSSQL_HOST` / `MSSQL_PORT` | drill | Backup drill connection overrides |
| `PFMP_BACKUP_DIR` | drill | Path **inside** SQL Server for `.bak` |
| `PFMP_PDF_HTML_ONLY` | worker | `true` forces HTML A4 artifact (no Chromium) |
| `WORKER_POLL_MS` | worker | Job poll interval (default `2000`) |
| `E2E_FULL` / `E2E_MAGIC_LINK_URL` | e2e | Optional authenticated Playwright journeys |
| `E2E_PORT` / `E2E_BASE_URL` | e2e | Playwright target |

Do **not** set `NODE_ENV` in `.env` — Next.js and scripts manage it.

Zod-parsed env lives under `apps/web` (`src/lib/env.ts`); missing required vars fail fast at boot.

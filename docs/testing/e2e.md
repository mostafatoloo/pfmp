# Playwright e2e (Phase 1)

Config: `apps/web/playwright.config.ts`  
Specs: `apps/web/e2e/`

## Default smoke (CI)

Runs without full auth:

- Sign-in page visible (desktop + mobile projects)
- `/today` redirects to sign-in
- `GET /api/v1/me` → 401
- Plan proposals without session → 401 (or 503 if AI off with session)

```bash
pnpm --filter @pfmp/web build
pnpm test:e2e
```

CI job installs Playwright Chromium and runs against `next start` with workflow env.

## Full journeys (local / optional)

Requires live SQL Server + Better Auth secrets and a captured magic link:

```bash
export E2E_FULL=1
export E2E_MAGIC_LINK_URL='http://localhost:3000/api/auth/magic-link/verify?token=…'
pnpm test:e2e
```

Covered when enabled: magic-link session, task capture, timer recover after reload.

## Blockers

No test mailbox in CI — full magic-link cookie flow is optional. Calendar Jalali week UI and PDF download UI e2e are deferred (API/authz covered in integration). See [phase-1-test-report.md](./phase-1-test-report.md).

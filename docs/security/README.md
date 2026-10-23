# Auth / security (Phase 1)

## Controls implemented

| Control | Mechanism |
|---------|-----------|
| Authentication | Better Auth sessions (magic link / passkeys) |
| Unauthenticated API | `/api/v1/*` → **401** `UNAUTHORIZED` |
| Workspace boundary | Server resolves workspace from session; repositories filter `workspaceId` |
| Forged resource IDs | Cross-workspace get/update → not found / forbidden (integration-tested) |
| Export download authz | Artifact + job lookups scoped to caller workspace |
| Secrets | `.env` gitignored; `.env.example` only; logs redact secrets / `DATABASE_URL` |
| AI off | `AI_ENABLED=false` → **503** `AI_UNAVAILABLE` (no silent fallback schedules) |

## Proven by tests

- SQL Server isolation suites (`workspace-isolation`, `stage5-security`)
- Web authz isolation + HTTP error contract smokes
- Playwright: unauthenticated `/api/v1/me` → 401

## Residual / follow-ups

- Dedicated automated burst test for magic-link rate limit (library defaults present)
- Production email provider required for real magic-link delivery
- Session revocation UX beyond Better Auth defaults — document ops runbooks in Phase 2 if needed

See [../architecture/auth-notes.md](../architecture/auth-notes.md).

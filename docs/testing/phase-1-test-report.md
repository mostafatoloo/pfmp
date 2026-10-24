# Phase 1 test report

Generated for Stage 6 delivery. Evidence also in Context `internal/stage5-quality-status.md`.

## Summary

| Suite | Result | Notes |
|-------|--------|-------|
| Unit (`pnpm test:unit`) | **Pass** | Domain, contracts, export serializers, env, auth logger |
| Integration DB | **Pass** — 26 tests | Isolation, Stage 4 modules, Stage 5 security, PDF `%PDF` |
| Integration web | **Pass** — 4 tests | Authz isolation + security HTTP contracts |
| Playwright e2e smoke | **Pass** — 8 tests (2 skipped) | Desktop + mobile; auth journeys skipped without `E2E_FULL` |
| Backup/restore drill | **Pass** | Local + CI `PFMP_BACKUP_DIR=/var/opt/mssql/data` |
| Next production build | **Pass** | No Playwright in web bundle |

## Failed tests

None recorded at Stage 5/6 gate on verified local runs. Confirm latest CI on PR head before merge.

## Coverage vs critical paths

| Path | Automated? |
|------|------------|
| Auth + workspace isolation | Yes (SQL + HTTP smoke) |
| Task reschedule history | Yes |
| Timer recover after refresh | Yes (service-level) |
| Proposal accept/reject; AI off | Yes |
| Export authz | Yes |
| Real A4 PDF (worker) | Yes when Chromium installed |
| Magic-link full UI cookie flow | Partial — optional `E2E_FULL` |
| Calendar Jalali week UI | Partial — unit/API; no CI e2e |
| PDF download UI | Partial — authz API; UI e2e deferred |

## Tooling

Vitest 3, Playwright 1.52, Prisma 7.10.1, SQL Server 2022 (Docker / GHA service).

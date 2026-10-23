# Unresolved issues & recommended Phase 2 decisions (notes only)

**No Phase 2 code in this delivery.** These are decision prompts for post-approval planning.

## Unresolved / ops follow-ups

| Item | Notes |
|------|-------|
| Production email for magic links | Choose provider; wire `RESEND_API_KEY` / `EMAIL_FROM` |
| Worker hosting + Chromium image | Pin Playwright browser version; font pack for Persian PDF |
| Azure SQL backup policy | Prefer PITR; keep local `.bak` drill for Docker only |
| Magic-link rate-limit load test | Add dedicated suite if abuse becomes a risk |
| Full e2e mailbox | Mailinator / Mailhog / Better Auth test hook for CI |
| Session revoke admin UX | Product decision for multi-device security settings |

## Recommended Phase 2 decisions (product)

| Topic | Recommendation to decide |
|-------|--------------------------|
| Family / shared workspaces | Invite model, roles, vs personal-only forever |
| Telegram adapter | Bot auth linking to existing user; notification channel only first |
| Meal planning | Separate bounded context; do not overload Task |
| Full conversational AI | Keep proposal preview/accept; never silent schedule replace |
| Offline / native | PWA vs React Native; sync model |
| Invoicing | Only if billable projects graduate beyond a flag |
| Multi-tenant admin | Explicitly separate from personal Phase 1 schema |

## Explicit non-goals until approval

Do not implement family collaboration, meals, Telegram, autonomous AI schedule mutation, offline-first, or native apps until Phase 1 completion is **explicitly approved**.

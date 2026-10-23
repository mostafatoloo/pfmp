# Phase 2 completion report

**Status:** Implementation delivered for review. **Stop before Phase 3.**

## Features implemented

1. **Internationalization foundation** (`@pfmp/i18n`) — English-only enabled; RTL-capable locale registry; formatting utilities; missing-key detection; documented add-language process (`docs/setup/i18n.md`).
2. **Visual / UX redesign** — New design tokens, logical CSS, softer geometry, Outfit typography, responsive nav, redesigned shell and primary screens.
3. **Family collaboration** — Family workspaces, invites (tokenized, expiring), accept/decline, membership roles, APIs + UI.
4. **Meal planning** — Meal entries by category/date, shopping lists with check-off, APIs + UI; optional prep task generation in service layer.
5. **Telegram** — Secure link tokens, status/unlink, webhook with `/start`, `/today`, `/done`; setup guide.
6. **AI assistant** — Permission-aware context snapshot; chat API with verified fallback when AI off; proposal accept/reject hooks; user preference to disable AI.
7. **Recurrence** — Rule parsing + next occurrence + idempotent materialization service.
8. **Notifications** — Preference model + idempotent delivery records on `NotificationService`.
9. **Authz** — Active workspace via header/cookie; `requireWorkspaceAccess`; family membership checks on APIs.

## Database

- Migration: `packages/database/prisma/migrations/20261023120000_phase2_foundation`
- SQL Server only (additive columns/tables)

## Environment additions

See `.env.example` and `docs/setup/telegram.md`, `docs/setup/i18n.md`.

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot API token |
| `TELEGRAM_BOT_USERNAME` | Deep-link instructions |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook authentication |
| `PFMP_FORCE_RTL` | Dev RTL simulation |
| `AI_ENABLED` | Gate live/stub AI provider path |

## Tests

- Unit: i18n, family roles, recurrence
- Existing Phase 1 suites remain; run `pnpm test:unit` and `pnpm db:migrate` then `pnpm test:integration` against SQL Server

## Known limitations

- Live AI provider still stubbed unless a real `AiProvider` is injected; conversational path works with verified deterministic summaries when `AI_ENABLED=false`.
- Telegram requires real bot credentials for end-to-end delivery; automated tests should mock the Bot API.
- Full authenticated Playwright family/meal journeys need magic-link capture (same Phase 1 CI constraint).
- Email invite delivery for family invites returns a token to the inviter in API responses for Phase 2; production should email invite links.
- Owner transfer for family workspaces not yet implemented (owner cannot leave).
- Calendar meal filters are UI affordances; meal events should be merged into `CalendarQueryService` in a follow-up hardening pass.
- Export coverage for meals/family lists is partial relative to the full Phase 2 export matrix.
- Job queue claim is still `findFirst` + `updateMany` (Phase 1): not fully atomic; no stale-lock recovery or exponential backoff yet.
- Export artifacts still write to local disk; cloud storage adapter deferred.
- Integration stubs under `packages/database/tests/integration/phase2-*.test.ts` skip without `TEST_DATABASE_URL` — expand with full isolation cases next.

## Security notes

- Server-side membership checks on family/meal routes.
- Telegram tokens hashed; webhook secret supported.
- AI context limited to authorized workspace snapshot; user content treated as untrusted in system prompt.
- Invitation acceptance requires email match.

## Architecture decisions

- Keep personal + family as `Workspace.kind` rather than a parallel tenancy model.
- i18n without URL locale prefixes (English-only); preference-ready via `User.locale`.
- Design system stays CSS variables + shared shell (no second component library).

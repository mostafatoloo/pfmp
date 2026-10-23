# Product requirements (pointer)

## Binding specification

Phase 1 scope is defined by the Project specification:

- Context store: `docs/phase-1-spec.md` (mission, scope, deferred work, definition of done)
- Implementation plan: `docs/phase-1-implementation-plan.md` (Stages 1–6)
- Completion report (user-facing): Context store `docs/phase-1-completion-report.md`

This repository implements **Phase 1 only** on greenfield monorepo `mostafatoloo/pfmp`.

## In scope (Phase 1)

| Area | Summary |
|------|---------|
| Auth | Magic link + WebAuthn/passkeys (where enabled), sessions, personal workspace bootstrap |
| Tasks | Lifecycle, capture, filters, reschedule with original due + history |
| Study | Terms, courses, topics, assessments; topic progress ≠ time |
| Planning | Deterministic engine + limited AI proposals (preview / accept / reject) |
| Time / Pomodoro | Manual + timer (recover after refresh); configurable Pomodoro |
| Progress | Planned vs actual aggregations |
| Projects | Activities; optional billable flag |
| Calendar | Day/week/month + Jalali display |
| Export | PDF A4 RTL, CSV, XLSX, JSON — authenticated |
| Notifications | In-app foundation + SQL Server job worker |
| AI | Provider-independent gateway; stub offline; app usable with AI off |

## Explicitly out of scope until approval

Family collaboration, meal planning, Telegram, full conversational AI, autonomous schedule changes, offline-first, native apps, full invoicing, public multi-tenant admin.

Do **not** implement Phase 2/3 features without an explicit go-ahead after the Phase 1 completion review.

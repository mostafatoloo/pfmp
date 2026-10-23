# Known limitations (Phase 1)

Honest constraints after Stages 3–5. None of these are silent failures of the DoD gate; they are scoped deferrals.

1. **Full authenticated Playwright in CI** — needs magic-link capture or a test mailbox; CI ships public smoke only (`docs/testing/e2e.md`).
2. **Calendar Jalali week UI / PDF download UI** — not in CI e2e smoke; APIs and display helpers covered.
3. **Live AI provider** — stub gateway only; set `AI_ENABLED=true` + provider config when approved. App remains usable with AI off (`AI_UNAVAILABLE`).
4. **Notification email / Telegram** — in-app + job stub only; Telegram explicitly Phase 2+.
5. **Magic-link rate-limit burst** — Better Auth defaults configured; dedicated automated burst suite not asserted in Stage 5.
6. **PDF without worker Chromium** — falls back to A4 RTL HTML print-ready artifact (same API).
7. **Compose** — SQL Server service is first-class; web/worker container images are optional stubs, not production hardened.
8. **Passkeys** — depend on browser/RP configuration; magic link is the universal fallback.

Unresolved issues list and Phase 2 decision notes: [phase-2-recommendations.md](./phase-2-recommendations.md).

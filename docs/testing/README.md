# Testing

| Layer | Tool | Location |
|-------|------|----------|
| Unit | Vitest | `*.test.ts` in packages / `apps/web/src` |
| Integration | Vitest + SQL Server | `packages/database/tests/integration`, `apps/web/tests/integration` |
| E2E | Playwright | Stage 5 skeleton later |

Blocking Stage 3 gate: User A cannot read User B workspace data.

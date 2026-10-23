# Auth notes (Stage 3)

## Better Auth + SQL Server

- Adapter: `prismaAdapter(prisma, { provider: "sqlserver" })` — single Prisma client for auth + domain (ADR-001 / ADR-002).
- Tables: `user`, `session`, `account`, `verification`, `passkey` (Prisma `@@map`).
- Extra user fields: `timezone` (IANA), `locale`.

## Magic link

- Plugin: `magicLink` from `better-auth/plugins`.
- Dev: `sendMagicLink` logs URL when `RESEND_API_KEY` is unset.
- Rate limits: Better Auth defaults on magic-link endpoints.

## Passkeys (WebAuthn)

- Plugin: `@better-auth/passkey` when `PASSKEY_ENABLED=true`.
- Schema: `passkey` table migrated with Prisma.
- **Fallback:** If WebAuthn is unsupported or passkeys disabled, users authenticate with email magic link only. UI surfaces this on the sign-in page.

## Sessions / sign-out

- Cookie sessions; multi-session supported by Better Auth.
- Sign-out / revocation via Better Auth session APIs; `session.delete.after` hook logs (redacted) for audit.

## Personal workspace bootstrap

On `user.create.after`, `WorkspaceRepository.createPersonalWorkspace(userId)` creates:

1. `Workspace` (`kind=personal`)
2. `WorkspaceMember` (`role=owner`)

Idempotent if called again.

## Authorization helpers

- `requireWorkspace(headers)` → `{ userId, workspace, … }` or 401
- `assertSameWorkspace(ctx, resourceWorkspaceId)` → 403 on mismatch
- Never authorize using a client-supplied `workspaceId` alone

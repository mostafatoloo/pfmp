# Auth & session notes (Phase 1)

## Better Auth + SQL Server

- Adapter: Prisma client with SQL Server (`packages/auth`)
- Tables: `user`, `session`, `account`, `verification`, `passkey`
- Extra user fields: `timezone` (IANA), `locale`

## Magic link

- Plugin: `magicLink`
- Dev: `sendMagicLink` logs URL when `RESEND_API_KEY` is unset
- Production: configure Resend (or compatible) + `EMAIL_FROM`
- Rate limits: Better Auth defaults on magic-link endpoints

## Passkeys (WebAuthn)

- Plugin: `@better-auth/passkey` when `PASSKEY_ENABLED=true`
- If WebAuthn unsupported or disabled → magic link only (sign-in UI explains this)

## Sessions

- Cookie sessions; multi-session supported
- Sign-out / revocation via Better Auth session APIs

## Personal workspace bootstrap

On `user.create.after` → `WorkspaceRepository.createPersonalWorkspace(userId)`:

1. `Workspace` (`kind=personal`)
2. `WorkspaceMember` (`role=owner`)

Idempotent if re-entered.

## Authorization

- `requireWorkspace(headers)` → `{ userId, workspace, … }` or **401**
- `assertSameWorkspace` / repository filters → **403/404** on forged foreign IDs
- **Never** authorize using a client-supplied `workspaceId` alone

Security overview: [../security/README.md](../security/README.md).

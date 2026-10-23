# Auth notes (PFMP)

## Sign in / sign up

- **Sign in:** username + password (`username` plugin → `/sign-in/username`)
- **Sign up:** username + mobile + password (no SMS at registration)
  - Email is synthetic (`{username}@users.pfmp.local`) — not used for login
  - Mobile stored as `09xxxxxxxxx` for later password reset
- **Forgot password:** SMS OTP to the registered mobile only (`requestPasswordReset` / `resetPassword` on phoneNumber plugin)

## SMS (Negin)

- Provider: `https://sms.3300.ir/api/wsSend.ashx`
- Credentials: `DotisAcc.dbo.Acc_System` (`NeginUserName`, `NeginPass`, `NeginLine`) via `DOTISACC_DATABASE_URL`, or `NEGIN_*` env overrides
- Body is a **6-digit code only** (no URL) — Negin/3300 rejects messages that contain links
- Used **only** for password reset, not for sign-in or sign-up

## Passkey

- Plugin: `@better-auth/passkey` when `PASSKEY_ENABLED=true` (optional / not primary UI)

## Removed

- Email magic-link sign-in
- SMS OTP as a sign-in / sign-up method
- Email or phone as primary login identifiers

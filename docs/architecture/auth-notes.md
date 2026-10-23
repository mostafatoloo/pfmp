# Auth notes (PFMP)

## Primary: SMS OTP (Negin)

- Plugin: Better Auth `phoneNumber`
- SMS provider: Negin panel `https://sms.3300.ir/api/wsSend.ashx`
- Credentials: `DotisAcc.dbo.Acc_System` (`NeginUserName`, `NeginPass`, `NeginLine`) via `DOTISACC_DATABASE_URL`, or `NEGIN_USERNAME` / `NEGIN_PASSWORD` / `NEGIN_LINE`
- Body is a **6-digit code only** (no URL) — Negin/3300 rejects messages that contain links
- Iranian mobiles normalized to `09xxxxxxxxx`
- `signUpOnVerification` creates an account with a temporary email (`09…@phone.pfmp.local`)

## Password

- Better Auth `emailAndPassword` enabled (min 6 chars)
- Sign-in: email + password, or phone + password (`signIn.phoneNumber`)
- After SMS verify, UI offers optional “set password” for later password login
- Password reset OTP over SMS: `sendPasswordResetOTP` (code only)

## Passkey

- Plugin: `@better-auth/passkey` when `PASSKEY_ENABLED=true`
- Optional fallback when WebAuthn is available

## Removed

- Email magic-link is no longer used for production sign-in

# Mobile email OTP login

Mobile sign-in uses **email → 6-digit code → verify** (no Google/Apple on login).

## Supabase setup (required)

1. **Authentication → Providers → Email** — enabled.
2. **Authentication → Email Templates → Magic Link** — paste the HTML from
   `supabase/email-templates/magic-link-sign-in-otp.html` (matches the confirm-email design; uses `{{ .Token }}` only, no `{{ .ConfirmationURL }}`).

3. Optional: custom SMTP under **Project Settings → Auth**.

## App behavior

- `sendEmailLoginOtp` calls `signInWithOtp` with **`shouldCreateUser: false`** (login-only; no new auth users on mobile).
- After verify, native requires an existing **`profiles`** row or the session is cleared.

Docs: [Supabase passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless)

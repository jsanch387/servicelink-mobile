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

## App Store review sign-in (optional)

Apple reviewers cannot read the inbox for your OTP test account. For **one** dedicated review email, the login screen shows a **password** field instead of sending a code.

1. In Supabase, ensure the review user exists with **email + password** (and a `profiles` row with demo-safe data).
2. Set `EXPO_PUBLIC_APP_REVIEW_LOGIN_EMAIL` in `.env.local` and in **EAS** env for production iOS builds (exact email Apple will type; case-insensitive).
3. In **App Store Connect → App Review Information → Notes**, include:
   - Email: (same as env)
   - Password: (the Supabase password for that user — do not commit this to the repo)

All other emails keep the normal OTP flow. Leave `EXPO_PUBLIC_APP_REVIEW_LOGIN_EMAIL` unset in builds where the feature is not needed.

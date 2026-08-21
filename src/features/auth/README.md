# Mobile sign-in

Mobile is **sign-in only** (App Store 3.1.1 companion). Accounts are created on the web. Owners can sign in with:

- **Email → 6-digit code → verify**
- **Google** or **Apple** (same in-app browser OAuth as before; existing ServiceLink account required)

## Supabase setup (required)

1. **Authentication → Providers → Email** — enabled.
2. **Authentication → Email Templates → Magic Link** — paste the HTML from
   `supabase/email-templates/magic-link-sign-in-otp.html` (matches the confirm-email design; uses `{{ .Token }}` only, no `{{ .ConfirmationURL }}`).

3. **Authentication → URL Configuration → Additional Redirect URLs** — add exactly:

   `servicelinkmobile://auth/callback`

4. **Authentication → Providers → Google** and **Apple** — enable both (same clients as the web app). Mobile uses Supabase-hosted OAuth in `expo-web-browser`, not native Google/Apple SDKs.

5. Optional: custom SMTP under **Project Settings → Auth**.

## App behavior

- `sendEmailLoginOtp` calls `signInWithOtp` with **`shouldCreateUser: false`** (login-only; no new auth users on mobile).
- After verify **or OAuth**, native requires an existing **`profiles`** row or the session is cleared (same “No account for this email” copy).
- Google / Apple open Supabase OAuth in the system in-app browser and return to `servicelinkmobile://auth/callback`. Sign-up stays on the web.

Docs: [Supabase passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless)

## App Store review sign-in (optional)

Apple reviewers cannot read the inbox for your OTP test account. For **one** dedicated review email, the login screen shows a **password** field instead of sending a code.

1. In Supabase, ensure the review user exists with **email + password** (and a `profiles` row with demo-safe data).
2. Set `EXPO_PUBLIC_APP_REVIEW_LOGIN_EMAIL` in `.env.local` and in **EAS** env for production iOS builds (exact email Apple will type; case-insensitive).
3. In **App Store Connect → App Review Information → Notes**, include:
   - Email: (same as env)
   - Password: (the Supabase password for that user — do not commit this to the repo)

All other emails keep the normal OTP flow. Leave `EXPO_PUBLIC_APP_REVIEW_LOGIN_EMAIL` unset in builds where the feature is not needed.

## Maestro E2E auto login (dev only)

For UI E2E, the app can skip the login screen in **`__DEV__`** builds when:

```bash
EXPO_PUBLIC_E2E_LOGIN=true
EXPO_PUBLIC_E2E_LOGIN_EMAIL=...
EXPO_PUBLIC_E2E_LOGIN_PASSWORD=...
```

are set in `.env.local`. Bootstrap calls `signInWithEmailPassword` when there is no persisted session. See `.maestro/README.md`.

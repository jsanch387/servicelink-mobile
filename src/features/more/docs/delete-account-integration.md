# Delete account integration (mobile + Next.js)

This document covers the end-to-end delete-account integration from the React Native app to the Next.js API, including runtime config, UI flow, logging, security guardrails, and tests.

## Scope

- Mobile screen: `src/features/more/screens/AccountSettingsScreen.jsx`
- Confirm sheet UI: `src/features/more/components/DeleteAccountConfirmSheet.jsx`
- Mobile hook: `src/features/more/hooks/useAccountSettings.js`
- Mobile API client: `src/features/more/api/deleteAccount.js`
- Shared origin resolver: `src/lib/webAppOrigin.js`
- Contract target: `DELETE /api/account` on the Next.js app

## Request contract

The mobile app sends:

- Method: `DELETE`
- URL: `{webAppOrigin}/api/account`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <session.access_token>`
- Body:
  - `{ "confirmEmail": "user@example.com" }`

Expected success response:

- `200` with `{ "success": true }` (server may include optional warnings)

## Mobile UX flow

1. User opens Account Settings and taps `Delete account`.
2. `DeleteAccountConfirmSheet` opens.
3. User must type the exact signed-in email.
4. Confirm button remains disabled until email matches.
5. On confirm:
   - mobile calls `deleteAccountViaWeb(...)`
   - on success, mobile calls `signOut()`
   - auth state clears and app returns to logged-out flow

Current behavior is intentionally strict:

- No delete call if email is empty.
- No delete call if access token is missing.
- Inline error is shown in the sheet if the server call fails.

## Origin resolution and environments

Origin is resolved by `getWebAppOrigin()` (`src/lib/webAppOrigin.js`) from:

1. `EXPO_PUBLIC_WEB_APP_URL`
2. `extra.webAppUrl` from `app.config.js`

`app.config.js` default is `https://myservicelink.app`.

### Local development

`deleteAccountViaWeb` has dev fallbacks when origin is empty or still prod default:

- iOS simulator: `http://localhost:3000`
- Android emulator: `http://10.0.2.2:3000`

Physical device should set:

- `EXPO_PUBLIC_WEB_APP_URL=http://<your-lan-ip>:3000`

And run Next.js with host binding:

- `next dev --hostname 0.0.0.0` (or equivalent script)

### Production

In production (`__DEV__ === false`), origin resolves to configured value or falls back to:

- `https://myservicelink.app`

Production guardrails in `deleteAccountViaWeb`:

- origin must be valid URL
- protocol must be `https:`
- localhost-like hosts are rejected (`localhost`, `127.0.0.1`, `10.0.2.2`)

These checks prevent accidental insecure/proxy/local routing in release builds.

## Logging policy (PII-safe)

Delete flow logs are intentionally minimal and safe:

- Prefix: `[account-delete]`
- Events:
  - `start` (host only)
  - `response` (host + status + ok)
  - `network-error` (host + error name)
  - `error` (host + status)
  - `success`

Not logged:

- email
- access token / auth header
- raw response body
- server error payload contents

This keeps debugging useful without leaking sensitive identifiers.

## Error handling

- API failures throw an `Error` with safe fallback text.
- `DeleteAccountConfirmSheet` renders errors via `InlineCardError`.
- If delete succeeds but sign-out fails, screen shows a user-facing alert (`safeUserFacingMessage`).

## Test coverage

Focused tests live in:

- `src/features/more/__tests__/deleteAccountApi.test.js`

Covered scenarios:

- correct request shape (method, headers, body)
- dev fallback URL behavior
- production fallback URL behavior
- production reject for insecure origin

Run:

`npm test -- --runTestsByPath "src/features/more/__tests__/deleteAccountApi.test.js" --watch=false`

## Ops checklist before release

- Set production env:
  - `EXPO_PUBLIC_WEB_APP_URL=https://myservicelink.app`
- Confirm mobile and web use same Supabase project.
- Validate server endpoint accepts Bearer JWT on `DELETE /api/account`.
- Smoke test on:
  - iOS simulator (local Next.js)
  - Android emulator (local Next.js)
  - production build against live domain
- Verify logs:
  - mobile: `[account-delete] start/response/success`
  - server: `[account-delete] start/success`

## Troubleshooting quick reference

- Error: `EXPO_PUBLIC_WEB_APP_URL is not set`
  - set env var and restart Expo.
- Error: production requires https origin
  - fix `EXPO_PUBLIC_WEB_APP_URL` to an `https://` host.
- 401 from server
  - confirm Authorization Bearer handling in Next.js route and matching Supabase project keys.
- Network request failed on physical device
  - use LAN IP origin and bind Next.js to `0.0.0.0`.

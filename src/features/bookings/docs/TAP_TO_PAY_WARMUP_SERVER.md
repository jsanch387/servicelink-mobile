# Server instructions: Tap to Pay app warm-up (merchant connection token)

**Audience:** Web / API team (or paste this entire doc into your server-side coding agent)  
**Mobile repo:** `servicelink-mobile`  
**Related:** [`TAP_TO_PAY_TERMINAL_SERVER.md`](./TAP_TO_PAY_TERMINAL_SERVER.md), [`MOBILE_BOOKING_TAP_TO_PAY.md`](./MOBILE_BOOKING_TAP_TO_PAY.md)  
**Status:** **Required for production warm-up** — mobile ships today with a temporary booking fallback

---

## Copy-paste prompt (for server agent)

```text
Implement a merchant-scoped Stripe Terminal connection-token endpoint for ServiceLink mobile Tap to Pay warm-up.

Context:
- Mobile (iOS) warms up Stripe Terminal on app launch and foreground when the user is already signed in — no booking context yet.
- Today mobile calls POST /api/payments/tap-to-pay/connection-token and gets 404. It temporarily falls back to POST /api/availability/bookings/{bookingId}/tap-to-pay/connection-token using the merchant's most recent booking from Supabase. We want to remove that hack.

Requirements:
1. Add POST /api/payments/tap-to-pay/connection-token
2. Auth: Authorization: Bearer <supabase access token> (same as other mobile routes — NOT cookie-only)
3. Body (optional JSON): { "stripeAccountId": "acct_…" }
4. Resolve the signed-in user's business → payment_accounts row
5. Gate: onboarding_status === 'complete' AND charges_enabled === true
6. Require stripe_terminal_location_id populated (ensureTerminalLocation helper)
7. Create Stripe Terminal connection token ON THE CONNECTED ACCOUNT (direct charges model). Use Stripe-Account header or stripeAccount option — same as booking connection-token handler.
8. If body.stripeAccountId is provided, verify it matches payment_accounts.stripe_account_id for this business (403 if mismatch)
9. Response 200: { "success": true, "secret": "pst_…" }
10. Errors: JSON { "success": false, "error": "human-readable message" } with appropriate HTTP status
11. Reuse the same Stripe token creation logic as POST …/bookings/{bookingId}/tap-to-pay/connection-token — only drop booking validation
12. Echo X-Request-ID from request in response headers when present

Do NOT require a booking id. Do NOT create a PaymentIntent. This route only returns a connection token for SDK initialize/connect.

Charge model: direct charges on connected account. Mobile does NOT pass onBehalfOf to easyConnect.

Verification:
- curl -X POST https://<origin>/api/payments/tap-to-pay/connection-token -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"stripeAccountId":"acct_…"}' → 200 + secret
- Mobile Metro after app open: connection-token.ok scope=merchant → warmup.ok → terminal.connect.ok
```

---

## Why mobile needs this

### Problem

When a merchant opens the app (already signed in), Tap to Pay collection used to cold-start Stripe Terminal only after they tapped **Collect** on a booking. That meant:

- Multiple connection-token fetches
- `initialize()` + `disconnect` + `easyConnect()` while the customer waited
- Sheet UI said “ready” before Apple’s native `tapCard` UI appeared

### Mobile solution (shipped)

On **app launch** and **return to foreground**, mobile silently:

1. Confirms Stripe Connect is ready
2. Reads `stripe_terminal_location_id` + `stripe_account_id` from `payment_accounts` (Supabase)
3. Fetches a **connection token** (merchant route preferred)
4. Calls Stripe Terminal `initialize()` + `easyConnect(tapToPay)` — **no PaymentIntent**
5. Reuses that reader when the Tap to Pay sheet opens on a booking

Warm-up has **no UI**. It only runs on **iOS** when Terminal SDK is enabled.

### What blocks warm-up today

Mobile calls:

```
POST /api/payments/tap-to-pay/connection-token
```

Your server returns **404** (route does not exist). Mobile then falls back to the booking-scoped route with an arbitrary recent `bookingId` — fragile and unnecessary once this merchant route exists.

---

## Endpoint contract

### `POST /api/payments/tap-to-pay/connection-token`

| Item                       | Value                                                                        |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Purpose**                | Stripe Terminal connection token for app warm-up (SDK init / reader connect) |
| **Auth**                   | `Authorization: Bearer <supabase_jwt>`                                       |
| **Content-Type**           | `application/json`                                                           |
| **Optional header**        | `X-Request-ID` — echo back in response                                       |
| **Booking required?**      | **No**                                                                       |
| **PaymentIntent created?** | **No**                                                                       |

#### Request body

```json
{
  "stripeAccountId": "acct_1Ta…HgND"
}
```

| Field             | Required                     | Notes                                                                                                                     |
| ----------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `stripeAccountId` | Optional but **recommended** | Mobile always sends this when known. Server should verify it matches the merchant’s `payment_accounts.stripe_account_id`. |

Empty body `{}` is valid if the server derives the connected account from the authenticated user’s business.

#### Success response `200`

```json
{
  "success": true,
  "secret": "pst_test_…"
}
```

| Field     | Required | Notes                                             |
| --------- | -------- | ------------------------------------------------- |
| `success` | Yes      | Must be `true`                                    |
| `secret`  | Yes      | Non-empty Stripe Terminal connection token string |

#### Error responses

Use the same JSON envelope as other mobile Tap to Pay routes:

```json
{
  "success": false,
  "error": "Set up Stripe payments to use Tap to Pay."
}
```

| HTTP  | When                                                            | Example `error`                                            |
| ----- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| `401` | Missing / invalid Bearer token                                  | `Sign in again to collect payment.`                        |
| `403` | `stripeAccountId` does not match merchant’s connected account   | `Not authorized for this Stripe account.`                  |
| `422` | Connect not complete, charges disabled, or no terminal location | `Set up Stripe payments to use Tap to Pay.`                |
| `500` | Stripe API failure                                              | `Couldn’t connect to payments. Try again or mark as paid.` |

**Important:** Return **JSON**, not an HTML 404 page. Mobile treats non-JSON 404 as “route missing.”

---

## Server-side logic (pseudocode)

```text
POST /api/payments/tap-to-pay/connection-token
  user ← authenticateBearer(request)
  business ← loadBusinessForUser(user.id)
  account ← loadPaymentAccount(business.id)

  if account.onboarding_status != 'complete' OR account.charges_enabled != true
    return 422

  locationId ← account.stripe_terminal_location_id OR ensureTerminalLocation(business.id)
  if !locationId
    return 422

  if body.stripeAccountId AND body.stripeAccountId != account.stripe_account_id
    return 403

  secret ← stripe.terminal.connectionTokens.create(
    {},
    { stripeAccount: account.stripe_account_id }  // connected account — direct charges
  )

  return 200 { success: true, secret: secret.secret }
```

**Reuse** the Stripe call from `POST /api/availability/bookings/{bookingId}/tap-to-pay/connection-token`. The only difference is authentication scope (merchant user, not booking ownership check).

---

## Stripe charge model (do not change)

| Model                              | PaymentIntent                     | Connection token                 | Mobile `easyConnect`                    |
| ---------------------------------- | --------------------------------- | -------------------------------- | --------------------------------------- |
| **Direct charges** (current)       | Created on **connected account**  | Created on **connected account** | `locationId` only — **no `onBehalfOf`** |
| Destination charges (wrong for us) | Platform account + `on_behalf_of` | Platform or mixed                | Would need `onBehalfOf` — **not used**  |

If the connection token is created on the **platform** account but the PaymentIntent is on the **connected** account, collection fails at `processPaymentIntent` with `INVALID_REQUIRED_PARAMETER` / `on_behalf_of` errors.

---

## Data prerequisites

Mobile reads these from Supabase `payment_accounts` (not from this API):

| Column                        | Example    | Used for                                              |
| ----------------------------- | ---------- | ----------------------------------------------------- |
| `stripe_account_id`           | `acct_…`   | Sent in connection-token body; Terminal account scope |
| `stripe_terminal_location_id` | `tml_…`    | `easyConnect({ locationId })`                         |
| `onboarding_status`           | `complete` | Mobile gates warm-up                                  |
| `charges_enabled`             | `true`     | Mobile gates warm-up                                  |

`ensureTerminalLocation(businessId)` should already populate `stripe_terminal_location_id` on Connect complete and on first booking intent. Warm-up **does not** call the intent route — location must exist before app open.

---

## How mobile calls this (timeline)

### App cold start (user already signed in)

```text
1. Session restored from storage (no login screen)
2. Main tabs mount → TapToPayWarmupBootstrap
3. Mobile loads payment_accounts via Supabase
4. POST /api/payments/tap-to-pay/connection-token  ← YOU IMPLEMENT THIS
5. Stripe Terminal initialize() (tokenProvider invokes step 4)
6. easyConnect(tapToPay, locationId, merchantDisplayName)
7. Log: warmup.ok
```

### User opens Tap to Pay on a booking (later)

```text
1. POST …/bookings/{bookingId}/tap-to-pay/intent        ← existing
2. POST …/bookings/{bookingId}/tap-to-pay/connection-token  ← existing (booking scope overrides merchant registry)
3. retrievePaymentIntent → processPaymentIntent → Apple tapCard UI
```

If warm-up succeeded, mobile logs `terminal.connect.skip` (reuses reader).

### App returns to foreground

Same as step 4–7 if the reader dropped in background.

---

## Temporary mobile fallback (remove after merchant route ships)

Until your route exists, mobile:

1. Tries `POST /api/payments/tap-to-pay/connection-token`
2. On **404 only**, queries Supabase for the merchant’s most recently updated `bookings.id`
3. Calls `POST /api/availability/bookings/{bookingId}/tap-to-pay/connection-token` with `{ stripeAccountId }`

This works but is undesirable:

- Merchants with **zero bookings** cannot warm up
- Uses an unrelated booking id for a merchant-level operation
- Extra latency (Supabase query + booking route)

Once the merchant route returns `200`, mobile never uses the fallback.

---

## Suggested file location (web repo)

Mirror other payments mobile routes:

```
app/api/payments/tap-to-pay/connection-token/route.ts   (Next.js App Router)
```

Or equivalent in your API structure. Keep it alongside existing `POST /api/payments/servicelink/enable` patterns.

**Auth note:** Mobile sends `Authorization: Bearer`. Routes that only validate cookie sessions return **401** on device — same issue documented for `servicelink/enable`. This route **must** accept Bearer tokens.

---

## Verification checklist

### Server (curl)

```bash
curl -s -X POST "$ORIGIN/api/payments/tap-to-pay/connection-token" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test-warmup-1" \
  -d '{"stripeAccountId":"acct_…"}' | jq .
```

Expected: `{ "success": true, "secret": "pst_…" }`

### Mobile (Metro, physical iPhone)

After reloading the app from the home screen:

```text
[TapToPay] warmup.start
[TapToPay] api.request route=merchant-connection-token
[TapToPay] connection-token.ok scope=merchant
[TapToPay] terminal.init.ok reason=warmup
[TapToPay] terminal.connect.ok reason=warmup
[TapToPay] warmup.ok
```

You should **not** see:

- `connection-token.merchant.missing`
- `warmup-booking-fallback`
- `CONNECTION_TOKEN_PROVIDER_ERROR`
- HTML 404 responses

### Stripe Dashboard

Connected account → **Terminal** → connection tokens being created on the merchant account (not platform).

---

## Existing routes (unchanged)

These stay as-is; mobile still uses them during collection:

| Method | Path                                                                 | When                                                      |
| ------ | -------------------------------------------------------------------- | --------------------------------------------------------- |
| `POST` | `/api/availability/bookings/{bookingId}/tap-to-pay/connection-token` | Tap to Pay sheet open (overrides merchant token registry) |
| `POST` | `/api/availability/bookings/{bookingId}/tap-to-pay/intent`           | Creates PaymentIntent before collection                   |
| `POST` | `/api/availability/bookings/{bookingId}/actions`                     | `job_completed` after SDK success                         |

---

## Mobile source references

| File                                                                 | Purpose                             |
| -------------------------------------------------------------------- | ----------------------------------- |
| `src/features/tap-to-pay/api/postTapToPayMerchantConnectionToken.js` | HTTP client for merchant route      |
| `src/features/tap-to-pay/api/fetchTapToPayWarmupConnectionToken.js`  | Merchant + booking fallback         |
| `src/features/tap-to-pay/hooks/useTapToPayWarmup.js`                 | App launch / foreground warm-up     |
| `src/features/payments/api/fetchPaymentDashboard.js`                 | Reads `stripe_terminal_location_id` |

---

## Summary for implementer

**Build one new route:** `POST /api/payments/tap-to-pay/connection-token`

- Authenticate mobile Bearer token
- Resolve merchant’s connected Stripe account
- Return a Terminal connection token on that account
- No booking, no PaymentIntent
- Same Stripe logic as the booking connection-token handler

That unblocks silent Tap to Pay warm-up on app open for already-signed-in merchants.

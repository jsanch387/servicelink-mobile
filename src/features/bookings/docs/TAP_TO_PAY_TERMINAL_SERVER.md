# Server reference: Stripe Terminal Location for Tap to Pay

**Audience:** Web / API team  
**Status:** Implemented — `ensureTerminalLocation` on Connect complete + tap-to-pay intent  
**Mobile contract:** [`MOBILE_BOOKING_TAP_TO_PAY.md`](./MOBILE_BOOKING_TAP_TO_PAY.md)  
**Phase 2 migration (web repo):** `docs/sql/booking_tap_to_pay_phase2_migration.sql`

---

## Summary

**Stripe Connect** routes payouts (online + Tap to Pay charges). **Stripe Terminal Location** (`tml_…`) is a separate record required for in-person Tap to Pay on the device.

Mobile expects every successful `POST …/tap-to-pay/intent` to return:

```json
{
  "paymentIntentId": "pi_…",
  "clientSecret": "pi_…_secret_…",
  "amountCents": 200,
  "currency": "usd",
  "terminalLocationId": "tml_…",
  "stripeAccountId": "acct_…"
}
```

Empty `terminalLocationId` / `stripeAccountId` will cause collection to fail even when Connect is ready.

---

## What was built

### 1. Persist location id

On `payment_accounts`:

| Column                        | Type                    | Notes                                |
| ----------------------------- | ----------------------- | ------------------------------------ |
| `stripe_terminal_location_id` | `text` nullable         | Stripe id `tml_…`                    |
| `tap_to_pay_ready`            | `boolean` default false | Optional; set after location created |

### 2. Shared helper: `ensureTerminalLocation(businessId)`

1. Load `payment_accounts` → `stripe_account_id`, business profile.
2. If `stripe_terminal_location_id` is set → return it.
3. Else `POST /v1/terminal/locations` on the connected account.
4. Save `tml_…` to `payment_accounts`.
5. Return `{ terminalLocationId, stripeAccountId }`.

### 3. When it runs

| Trigger                                              | Purpose                                          |
| ---------------------------------------------------- | ------------------------------------------------ |
| Connect onboarding complete                          | New merchants get Tap to Pay with no extra steps |
| First `POST …/tap-to-pay/intent` if location missing | Safety net for existing Connect accounts         |

### 4. API responses

**`POST …/tap-to-pay/intent`** — must call `ensureTerminalLocation` before creating the PaymentIntent.

**`POST …/tap-to-pay/connection-token`** (booking) — must create the token on the **connected account** (`Stripe-Account: acct_…` or `stripeAccount` option). Mobile may send `{ "stripeAccountId": "acct_…" }` in the body (from the intent response) so the server can scope the token explicitly.

**`POST /api/payments/tap-to-pay/connection-token`** (merchant, no booking) — preferred for **app warm-up** when the user is already signed in. Same auth (`Authorization: Bearer`) and optional `{ "stripeAccountId": "acct_…" }` body. Response: `{ "success": true, "secret": "…" }`. Mobile reads `stripe_terminal_location_id` + `stripe_account_id` from `payment_accounts` (Supabase) to connect before any booking sheet opens.

**Fallback (until merchant route ships):** mobile uses `POST …/bookings/{bookingId}/tap-to-pay/connection-token` with the merchant’s most recently updated booking id from Supabase. Warm-up is skipped when neither route is available.

**Full server implementation brief:** [`TAP_TO_PAY_WARMUP_SERVER.md`](./TAP_TO_PAY_WARMUP_SERVER.md) — copy-paste prompt + contract for the merchant connection-token route.

Server uses **direct charges** (PI + connection token on the connected account). Mobile must **not** pass `onBehalfOf` to `easyConnect` — that parameter is only for **destination charges** (platform PI with `on_behalf_of`). Passing it with a direct-charge PI causes `INVALID_REQUIRED_PARAMETER` at `processPaymentIntent`.

`stripeAccountId` from the intent response is used for connection-token request body alignment and logging only.

Mobile parses connect fields in `parseTapToPayIntentConnectParams.js` (also accepts `locationId`, `merchantDisplayName`).

---

## Connect vs Terminal

|                         | Connect                   | Terminal Location              |
| ----------------------- | ------------------------- | ------------------------------ |
| Purpose                 | Payouts / online payments | In-person Tap to Pay on device |
| User-facing setup       | Yes — Payments onboarding | **No** — server-only           |
| Created by              | Connect onboarding        | `ensureTerminalLocation()`     |
| Required for Tap to Pay | Yes                       | Yes                            |

---

## Verification

1. New test business completes Connect → `stripe_terminal_location_id` populated.
2. Intent response includes non-empty `terminalLocationId` and `stripeAccountId`.
3. Stripe Dashboard → Terminal → Locations (connected account) shows at least one location.
4. Mobile Metro: `intent.ok` → `terminal.connect.ok` → `terminal.process.start`.

---

## Optional follow-up

| Item                                | Notes                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------- |
| Mobile gating on `tap_to_pay_ready` | Extend `useTapToPayConnectReadiness` — not required today               |
| Orphan PaymentIntent cleanup        | Cancel stale open PIs when a new intent is created for the same booking |
| Android Tap to Pay                  | Same server path; mobile UI hidden until Android app ships              |

---

## Mobile parsing reference

- `src/features/tap-to-pay/utils/parseTapToPayIntentConnectParams.js`
- `src/features/tap-to-pay/hooks/useTapToPayTerminalCollection.js` (`easyConnect` with `locationId` only — no `onBehalfOf` for direct charges)
- Dev logs: `[TapToPay]` prefix in Metro on device

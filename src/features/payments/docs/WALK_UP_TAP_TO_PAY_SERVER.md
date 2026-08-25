# Create payment — Walk-up Tap to Pay (v1)

**Audience:** Mobile + web / API  
**Status:** Implemented. Mobile posts this shape; server contract lives in the web repo as `docs/contracts/mobile-create-payment-tap-to-pay.md`.  
**Related:** [`WALK_UP_GET_PAID.md`](./WALK_UP_GET_PAID.md) (payment-link path), [`../../bookings/docs/MOBILE_BOOKING_TAP_TO_PAY.md`](../../bookings/docs/MOBILE_BOOKING_TAP_TO_PAY.md) (booking complete — different route)

Owner collects in person from **Home → Create payment → Tap to pay**. Amount + a short note is the whole charge. There is **no booking**, **no customer**, and **no appointment**.

**Not this flow:** `POST /api/availability/bookings/{bookingId}/tap-to-pay/intent`. Do not send a booking id. Do not call `job_completed`.

---

## Product summary

```text
Home FAB → Create payment → Tap to pay
  → amount + note
  → Charge
      1. POST /api/payments/tap-to-pay/intent
      2. Stripe Terminal / Apple Tap to Pay UI (clientSecret)
      3. Owner toast “Paid” and close
```

There is **no ServiceLink sheet** after Charge. The reader is the UI. **Do not poll.** **Do not** write `payment_requests` or create the PaymentIntent in the app.

| Step | Mobile UI                | Server                                                                              |
| ---- | ------------------------ | ----------------------------------------------------------------------------------- |
| 1    | Amount + “what’s it for” | Auth + Connect gate                                                                 |
| 2    | Charge                   | `ensureTerminalLocation` + PI on the connected account                              |
| 3    | Native Tap to Pay UI     | Insert `payment_requests` (`status: open`, `collection_method: tap_to_pay`)         |
| 4    | Owner toast “Paid”       | Connect webhook marks the row `paid`                                                |

Warm-up uses **`POST /api/payments/tap-to-pay/connection-token`** (merchant-scoped, no booking). Do **not** use the booking `…/bookings/{id}/tap-to-pay/connection-token` for this screen.

Expo Go cannot open the reader. A **dev / production iOS build** with Terminal + the Tap to Pay entitlement can. The intent route still works without a phone tap (curl / logs).

Cancel on Apple’s UI is **not** an error. Charge again creates a **new** PaymentIntent.

---

## Endpoints

| Method | Path                                        | Purpose                                 |
| ------ | ------------------------------------------- | --------------------------------------- |
| `POST` | `/api/payments/tap-to-pay/intent`           | Walk-up PaymentIntent for amount + note |
| `POST` | `/api/payments/tap-to-pay/connection-token` | Merchant Terminal token (app warm-up)   |

**Origin:** `resolveStripeMobileCheckoutOrigin()` / `EXPO_PUBLIC_WEB_APP_URL`. Same Bearer JWT as `POST /api/payments/link`.

---

## Headers

| Header          | Required | Value                            |
| --------------- | -------- | -------------------------------- |
| `Authorization` | yes      | `Bearer <Supabase access_token>` |
| `Content-Type`  | yes      | `application/json`               |
| `Accept`        | no       | `application/json`               |
| `X-Request-ID`  | no       | UUID; echoed as `X-Request-ID`   |

Server resolves `business_id` from the signed-in profile. **Do not** send `businessId`.

---

## Request body (`/intent`)

```json
{
  "amountCents": 4000,
  "currency": "usd",
  "note": "Lights",
  "stripeAccountId": "acct_…"
}
```

| Field             | Required | Rules                                                                  |
| ----------------- | -------- | ---------------------------------------------------------------------- |
| `amountCents`     | yes      | Integer `50`–`999999` (Stripe $0.50 min; keypad cap $9,999.99)         |
| `currency`        | no       | Must be `usd` when sent. Defaults to `usd`.                            |
| `note`            | yes      | Trimmed, non-empty, max **200**. PI description + metadata             |
| `stripeAccountId` | no       | Sent when mobile knows it. Must match this business’s `acct_…`.        |

Do not send a customer, booking id, or phone.

---

## Success (`/intent`, HTTP 200)

```json
{
  "success": true,
  "paymentIntentId": "pi_…",
  "clientSecret": "pi_…_secret_…",
  "amountCents": 4000,
  "currency": "usd",
  "terminalLocationId": "tml_…",
  "stripeAccountId": "acct_…",
  "merchantDisplayName": "Acme Detail"
}
```

| Field                 | Required for mobile | Notes                                                     |
| --------------------- | ------------------- | --------------------------------------------------------- |
| `success`             | yes                 | Must be `true`                                            |
| `paymentIntentId`     | yes                 |                                                           |
| `clientSecret`        | yes                 | Terminal `retrievePaymentIntent` / `processPaymentIntent` |
| `amountCents`         | yes                 | Echo the charged amount                                   |
| `currency`            | yes                 | `usd`                                                     |
| `terminalLocationId`  | yes                 | Empty → collection fails even if the PI is valid          |
| `stripeAccountId`     | yes                 | Empty → collection fails                                  |
| `merchantDisplayName` | no                  | Business name for the Terminal reader UI                  |

Server also sends `locationId` and `stripe_terminal_location_id` as aliases of `terminalLocationId` (`parseTapToPayIntentConnectParams.js`).

Charge model is **direct charges** on the connected account. Mobile does **not** pass `onBehalfOf` to `easyConnect`.

---

## Errors

Body is always `{ "success": false, "error": "human-readable message" }` with a real HTTP status.

| Status  | When                                      | Mobile                                                                 |
| ------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| 401     | Signed out / bad token                    | Sign in again to collect payment.                                      |
| 400     | Bad amount, note, currency, or account id | Prefer server `error` (amount / note / USD / `stripeAccountId`)        |
| 404     | No business profile                       | Business profile not found                                             |
| 422     | Connect not ready                         | Set up Stripe payments to use Tap to Pay.                              |
| 403     | `stripeAccountId` mismatch                | Stripe account does not match this business.                           |
| 429     | Rate limited                              | Server `error`; `Retry-After` seconds. **15/min and 80/hour per owner** |
| 500/502 | Persist or Stripe create failed           | Couldn’t start Tap to Pay. Try again.                                  |

Treat **404** as “no business,” and **422** as “finish Stripe setup.” Prefer the server `error` string when present.

---

## Connect / payments gate

Same as payment link: signed-in owner, `business_profiles` row, `onboarding_status === 'complete'`, `charges_enabled === true`. Hide Tap to pay until Connect is ready. Does **not** require `payment_settings.payments_enabled` (booking checkout only).

---

## Connection token (warm-up)

Walk-up collection uses the **merchant** token, not a booking fallback.

`POST /api/payments/tap-to-pay/connection-token`

Body may be empty `{}` or `{ "stripeAccountId": "acct_…" }` (must match this business when sent).

Success: `{ "success": true, "secret": "pst_…" }`

Same auth, Connect gate, `X-Request-ID` echo, and `{ success: false, error }` errors as `/intent`.

---

## After the customer taps

Stripe confirms the PaymentIntent. Mobile does **not** call a second route.

| Event                           | Server                                                                 |
| ------------------------------- | ---------------------------------------------------------------------- |
| `payment_intent.succeeded`      | Amount matches → `payment_requests.status = paid`. Mismatch → `failed` |
| `payment_intent.canceled`       | Open row → `canceled`                                                  |
| `payment_intent.payment_failed` | Open row → `failed`                                                    |
| Owner backs out of Apple UI     | Unused PI may expire; leave the open row                               |

Lookup is by `metadata.paymentRequestId` or `pi_…`. Kind is `walkup_tap_to_pay` (booking complete uses `booking_tap_to_pay` and is ignored). **Do not** write `booking_payments`. **Do not** call `job_completed`.

Owner toast is **Paid**. That is the only confirmation in v1. Mobile does **not** wait for the webhook.

---

## Receipts / confirmation (not this pass)

No ServiceLink receipt, email, or SMS. There is no customer on the charge.

Stripe / the card network may still notify the cardholder (bank push, card statement, Checkout email on the **payment-link** path). Do **not** send review invite, job SMS, or invoice email from this flow.

---

## What mobile must not do

- Create the PaymentIntent in the app
- Insert / update `payment_requests` from the client
- Attach this charge to a booking, quote, or CRM customer
- Use the booking connection-token for walk-up collection
- Pass `onBehalfOf` to Terminal / `easyConnect`
- Treat cancel on Apple’s UI as an error
- Poll for paid status (v1)
- Call a second complete route after a successful tap

---

## Mobile files

| Path | Role |
| ---- | ---- |
| `create-payment/hooks/useCreatePaymentCharge.js` | Charge → merchant intent → Terminal collect |
| `tap-to-pay/api/postTapToPayMerchantIntent.js` | `POST /api/payments/tap-to-pay/intent` |
| `tap-to-pay/api/postTapToPayMerchantConnectionToken.js` | `POST /api/payments/tap-to-pay/connection-token` |
| `tap-to-pay/api/fetchTapToPayWarmupConnectionToken.js` | Merchant token only (no booking fallback) |
| Create payment screen gates | Pro + Connect before the chooser (same as payment link) |

---

## Out of scope (later)

- Customer receipt / confirmation email or SMS
- Attaching this charge to a booking, quote, or CRM customer
- Live Transactions list (UI is still mock)
- Android Tap to Pay

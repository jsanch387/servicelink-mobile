# Create payment — Payment link (v1)

**Audience:** Mobile + web / API  
**Status:** Payment link is v1. Walk-up Tap to Pay: [`WALK_UP_TAP_TO_PAY_SERVER.md`](./WALK_UP_TAP_TO_PAY_SERVER.md).  
**Server contract (web repo):** `docs/contracts/mobile-create-payment-link.md`

Owners get paid **without a booking**: Home FAB → **Create payment** → **Payment link**. Amount + a short note is the whole charge. No customer, booking, or appointment.

---

## Rollout (mobile)

Compile-time flags live in `create-payment/constants/createPaymentFeatureFlags.js`.

| Flag                                 | Current     | Effect                                                                                        |
| ------------------------------------ | ----------- | --------------------------------------------------------------------------------------------- |
| `CREATE_PAYMENT_FEATURE_ENABLED`     | `true`      | Kill switch. `false` hides the FAB item and bounces the screen.                               |
| `CREATE_PAYMENT_EARLY_ACCESS_EMAILS` | `[]` (open) | **Non-empty:** only those logins see Create payment. **Empty:** everyone can open the screen. |

Pro and Stripe Connect still apply. Free users still see **Create payment** on the FAB; tapping it opens **More → Payments → Settings**.

---

## Client gates (in order)

```text
Home FAB
  └─ hidden if the kill switch is off, or an email allowlist is set and this login is not on it
  └─ shown for free users (upgrade nudge). Tap → More → Payments → Settings

Create payment screen
  ├─ Not Pro            → redirect to More → Payments → Settings
  ├─ Pro, no Connect    → “Set up payments” → More → Payments → Settings
  └─ Pro + Connect      → Get paid chooser (Payment link + Tap to pay)
```

Connect means `payment_accounts.onboarding_status === 'complete'` and `charges_enabled === true` (`isStripeConnectReady`). Same gate the server uses.

---

## Payment link — owner flow

```text
Get paid → Payment link
  → amount + “what’s it for”
  → Create payment link
      1. POST /api/payments/link
      2. Payment link ready
      3. Share or Copy the returned URL
```

The customer pays later in Stripe Checkout. Mobile does **not** poll. The URL is a **one-time** Checkout Session (expires in 24 hours). Creating again makes a new URL.

Display: whole dollars hide `.00` (`$250`). Cents show when present (`$85.50`). Stored value is still `amountCents`.

---

## Server integration

**Origin:** `resolveStripeMobileCheckoutOrigin()` (`EXPO_PUBLIC_WEB_APP_URL`). Same Bearer JWT as other owner payment routes.

```http
POST /api/payments/link
Authorization: Bearer <supabase access_token>
Content-Type: application/json
X-Request-ID: <uuid>

{
  "amountCents": 4000,
  "currency": "usd",
  "note": "Headlight Restoration"
}
```

| Field         | Rules                                                          |
| ------------- | -------------------------------------------------------------- |
| `amountCents` | Integer `50`–`999999` (Stripe $0.50 min; keypad cap $9,999.99) |
| `currency`    | `usd` when sent                                                |
| `note`        | Trimmed, required, max 200 chars (Checkout line name)          |

Success `200`:

```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_…",
  "paymentLinkId": "cs_…",
  "paymentRequestId": "<uuid>"
}
```

Mobile copies / shares **exactly** `url` (`paymentUrl` / `checkoutUrl` also accepted). Optional ids are stored only if returned.

| Status  | Mobile                       |
| ------- | ---------------------------- |
| 401     | Sign in again                |
| 404     | No business profile          |
| 422     | Finish Stripe setup          |
| 429     | Rate limited (`Retry-After`) |
| 500/502 | Couldn’t create the link     |

After pay: Connect webhook `checkout.session.completed` marks `payment_requests` `paid`. **Do not** write `booking_payments`. **Do not** call a second complete route.

---

## What mobile must not do

- Call Stripe Checkout / Payment Links APIs
- Insert or update `payment_requests`
- Attach this charge to a booking, quote, or CRM customer
- Poll for paid status (v1)

---

## Out of scope (next / later)

- Deposit links on appointment create
- Auto-text the URL
- ServiceLink receipts (Stripe Checkout / the card network may still notify the payer)
- Owner revoke / expire a live link
- Branded short URL (`myservicelink.app/pay/…`)

---

## Mobile files

| Path                                                    | Role                          |
| ------------------------------------------------------- | ----------------------------- |
| `create-payment/constants/createPaymentFeatureFlags.js` | Kill switch + email allowlist |
| `create-payment/utils/resolveCreatePaymentAccess.js`    | FAB / screen rollout          |
| `create-payment/hooks/useCreatePaymentAccess.js`        | Runtime access                |
| `screens/CreatePaymentScreen.jsx`                       | Pro + Connect gates           |
| `create-payment/CreatePaymentFlow.jsx`                  | Choose → form → ready         |
| `create-payment/api/postCreatePaymentLink.js`           | `POST /api/payments/link`     |
| `create-payment/hooks/useCreatePaymentLink.js`          | Create + toast errors         |

Booking Tap to Pay (complete visit) is separate: [`../../bookings/docs/MOBILE_BOOKING_TAP_TO_PAY.md`](../../bookings/docs/MOBILE_BOOKING_TAP_TO_PAY.md).

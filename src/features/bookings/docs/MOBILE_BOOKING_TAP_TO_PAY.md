# Contract: Mobile — Tap to Pay (Complete sheet / Phase 2)

Owner collects the **remaining balance** on-site using **Stripe Tap to Pay on iPhone** from the **Complete** full-screen sheet, then closes the job with the existing `job_completed` action.

**Prerequisite lifecycle:** [`MOBILE_BOOKING_WORK_FINISHED.md`](./MOBILE_BOOKING_WORK_FINISHED.md) (Done/Skip) → Complete sheet per [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md).

**Server contract (web repo):** `docs/contracts/mobile-booking-tap-to-pay.md`  
**DB migration (server):** `docs/sql/booking_tap_to_pay_phase2_migration.sql`

---

## Product summary

Tap to Pay does **not** use Stripe Checkout. The server creates a **PaymentIntent** on the business Connect account; mobile runs the **Terminal / Tap to Pay SDK** with the returned `clientSecret`.

| Step | Mobile UI                                     | Server                                                                       |
| ---- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| 1    | Complete sheet shows line items + balance due | Booking + `booking_payments` (Phase 1)                                       |
| 2    | Owner taps **Tap to Pay**                     | `POST …/tap-to-pay/connection-token` (SDK init, when SDK enabled)            |
| 3    | SDK ready; owner confirms amount              | `POST …/tap-to-pay/intent` with current `sessionFees`                        |
| 4    | Native Tap to Pay UI; customer taps card      | Stripe confirms PaymentIntent                                                |
| 5    | SDK reports success                           | `POST …/actions` `job_completed` with `tap_to_pay` + `stripePaymentIntentId` |
| 6    | Success toast; sheet closes                   | Persist fees, payment, invoice, notify customer (Phase 1 pipeline)           |

**Golden rule:** Tap to Pay is a **convenience** path. **Mark as paid** (`cash` / `payment_app` / `other`) always remains available. A failed or cancelled tap must **never** block completion.

**Do not** call Supabase to update payment state directly. **Do not** skip `job_completed` after a successful tap.

---

## Endpoints

| Method | Path                                                                 | Purpose                               |
| ------ | -------------------------------------------------------------------- | ------------------------------------- |
| `POST` | `/api/availability/bookings/{bookingId}/tap-to-pay/connection-token` | Terminal connection token (SDK init)  |
| `POST` | `/api/availability/bookings/{bookingId}/tap-to-pay/intent`           | PaymentIntent for current amount due  |
| `POST` | `/api/availability/bookings/{bookingId}/actions`                     | `job_completed` — verify PI + persist |

Shared headers: `Authorization: Bearer <token>`, `Content-Type: application/json`, optional `X-Request-ID`.

---

## Amount-due math (must match Complete sheet)

Same formula as [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md):

```
amountDueCents =
  service_price_cents
  + sum(addon_details[].priceCents)
  + sum(sessionFees[].amountCents)
  - paid_online_amount_cents
```

Intent creation uses **`amountDueCents`** (no session payment yet).  
`job_completed` sends `sessionPayment.amountCents` equal to the succeeded tap amount.

---

## SDK sequence (mobile)

```text
1. [When SDK enabled] POST …/connection-token → secret → SDK init
2. Owner taps Tap to Pay on Complete sheet
3. POST …/intent { sessionFees } → paymentIntentId, clientSecret, amountCents
4. SDK: discover Tap to Pay reader → collectPaymentMethod → confirmPaymentIntent
5. On SDK success → POST …/actions job_completed with tap_to_pay + stripePaymentIntentId
6. On 200 → success UI
```

If owner **adds or edits a fee** after step 3, discard the old intent client-side and call **intent** again.

---

## `job_completed` body (Tap to Pay path)

```json
{
  "action": "job_completed",
  "sessionFees": [{ "label": "Pet hair removal", "amountCents": 2500 }],
  "sessionPayment": {
    "method": "tap_to_pay",
    "amountCents": 12000,
    "stripePaymentIntentId": "pi_…"
  }
}
```

Call **only after** SDK reports PaymentIntent **succeeded**. Pass the **same** `sessionFees` used when creating the intent.

---

## UI states

| State                    | UI                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Loading intent           | Disable Tap to Pay; spinner in sheet                                                  |
| SDK collecting           | “Hold card near iPhone…”                                                              |
| SDK success → completing | “Completing…” while `job_completed` in flight (SDK auto-complete path)                |
| Intent / SDK error       | Inline error + **Try again** + **Mark as paid**                                       |
| Connect not ready (422)  | Locked Tap to Pay + hint; tap opens **More → Payments** (Pro upsell or Connect setup) |

---

## Connect gating on Complete sheet

Before Tap to Pay collection, mobile reads `payment_accounts` (same rule as Payments tab):

| Connect state                                                  | Tap to Pay button                                                                              | Mark as paid     |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------- |
| Not ready                                                      | Locked **Tap to Pay** button + “Tap to Pay not set up” callout with **Get started** → Payments | Always available |
| Loading                                                        | Spinner on button                                                                              | Always available |
| Ready (`onboarding_status === 'complete'` + `charges_enabled`) | Active — opens Tap to Pay sheet                                                                | Always available |

Non‑Pro owners land on the Payments web upsell; Pro owners without Connect see the Stripe Connect setup card.

---

## Feature flags (`tap-to-pay/constants/tapToPayFeatureFlags.js`)

| Flag                             | Production today | Notes                                                                                |
| -------------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `TAP_TO_PAY_USE_SERVER_APIS`     | `true`           | Calls connection-token + intent                                                      |
| `TAP_TO_PAY_USE_TERMINAL_SDK`    | `true`           | Requires native dev client / store build with `@stripe/stripe-terminal-react-native` |
| `TAP_TO_PAY_DEV_MOCK_COLLECTION` | off when SDK on  | Mock tap only when SDK flag is false                                                 |

`isTapToPayUiEnabled()` — shows **Tap to Pay** button when server APIs + (SDK or dev mock).

---

## Mobile code map

| Concern                  | Path                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| Complete sheet entry     | `booking-details/components/BookingCompleteInvoiceDesignSheet.jsx`       |
| Tap overlay              | `tap-to-pay/components/TapToPaySheet.jsx`                                |
| Intent + collection hook | `tap-to-pay/hooks/useTapToPaySheet.js`                                   |
| HTTP                     | `tap-to-pay/api/postTapToPayConnectionToken.js`, `postTapToPayIntent.js` |
| Session fees for intent  | `tap-to-pay/utils/buildTapToPaySessionFees.js`                           |
| Connect gating           | `tap-to-pay/hooks/useTapToPayConnectReadiness.js`                        |
| Terminal SDK             | `tap-to-pay/hooks/useTapToPayTerminalCollection.js`                      |
| `job_completed` payload  | `booking-details/utils/buildJobCompletedPayload.js`                      |
| Confirm hook             | `booking-details/hooks/useMarkBookingCompleteFlow.js`                    |

---

## Error mapping

HTTP errors use `mapTapToPayHttpError.js`. Prefer server `error` string when present.

| HTTP    | Suggested copy                                       |
| ------- | ---------------------------------------------------- |
| **400** | Nothing to collect / validation                      |
| **409** | Mark work done before collecting payment             |
| **422** | Set up Stripe payments to use Tap to Pay             |
| **500** | Couldn’t start Tap to Pay. Try again or mark as paid |

---

## Tests

```bash
npm test -- --testPathPattern="tap-to-pay|buildJobCompletedPayload"
```

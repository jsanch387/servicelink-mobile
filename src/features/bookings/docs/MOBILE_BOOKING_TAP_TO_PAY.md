# Contract: Mobile — Tap to Pay (Complete sheet / Phase 2)

Owner collects the **remaining balance** on-site using **Stripe Tap to Pay on iPhone** from the **Complete** full-screen sheet, then closes the job with the existing `job_completed` action.

**Prerequisite lifecycle:** [`MOBILE_BOOKING_WORK_FINISHED.md`](./MOBILE_BOOKING_WORK_FINISHED.md) (Done/Skip) → Complete sheet per [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md).

**Server contract (web repo):** `docs/contracts/mobile-booking-tap-to-pay.md`  
**Terminal Location (web):** [`TAP_TO_PAY_TERMINAL_SERVER.md`](./TAP_TO_PAY_TERMINAL_SERVER.md) — implemented  
**DB migration (server):** `docs/sql/booking_tap_to_pay_phase2_migration.sql`

---

## Status (mobile)

| Item                                                 | Status                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| Complete sheet entry + Connect gating                | Done                                                                |
| Tap to Pay sheet (auto-start on open)                | Done                                                                |
| Server APIs (connection-token, intent)               | Wired                                                               |
| Stripe Terminal SDK collection                       | Wired                                                               |
| Auto `job_completed` after successful tap (SDK path) | Done                                                                |
| Apple merchant education (ProximityReader, once)     | Done                                                                |
| Payments “How it works” + What’s new (iOS)           | Done                                                                |
| Android UI                                           | Hidden for v1 (`isTapToPayPlatformSupported`)                       |
| **Production blocker**                               | Apple **Tap to Pay on iPhone** entitlement approval + new iOS build |

**Next step:** After Apple approves, run `EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios`, install on a physical iPhone, and verify `terminal.connect.ok` in Metro.

---

## Product summary

Tap to Pay does **not** use Stripe Checkout. The server creates a **PaymentIntent** on the business Connect account; mobile runs the **Stripe Terminal / Tap to Pay SDK** with the returned `clientSecret`.

| Step | Mobile UI                                     | Server                                                                       |
| ---- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| 1    | Complete sheet shows line items + balance due | Booking + `booking_payments` (Phase 1)                                       |
| 2    | Owner taps **Tap to Pay** → sheet opens       | —                                                                            |
| 3    | Sheet auto-starts: connection token + intent  | `POST …/connection-token`, `POST …/intent`                                   |
| 4    | Terminal listens; customer taps card          | Stripe confirms PaymentIntent                                                |
| 5    | SDK reports success                           | `POST …/actions` `job_completed` with `tap_to_pay` + `stripePaymentIntentId` |
| 6    | Success UI; sheet closes                      | Persist fees, payment, invoice, notify customer                              |

**Golden rule:** Tap to Pay is a **convenience** path. **Mark as paid** (`cash` / `payment_app` / `other`) always remains available. A failed or cancelled tap must **never** block completion.

**Do not** call Supabase to update payment state directly. **Do not** skip `job_completed` after a successful tap.

---

## PaymentIntent timing (intentional)

When the owner taps **Tap to Pay**, the sheet opens and **immediately** calls `POST …/intent` — there is no second in-app tap. This matches Stripe Terminal’s requirement (a `clientSecret` before NFC collection) and is the standard in-person flow.

| Scenario                            | Behavior                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| Opens sheet, closes without paying  | One unused PI may exist in Stripe (auto-expires); optional server cleanup later |
| **Try again** after error           | New intent API call (fresh PI)                                                  |
| Fee added/removed on Complete sheet | Local tap state cleared; next open uses updated `sessionFees`                   |

Local `tapToPayAmount` / `stripePaymentIntentId` are applied **only after SDK success**, not when the intent is created.

---

## Platform scope (v1)

| Platform    | Tap to Pay button                   | Notes                                                                                    |
| ----------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| **iOS**     | Shown when Connect ready + flags on | Requires physical iPhone + entitlement in app binary                                     |
| **Android** | Hidden                              | Same code path exists; enable via `isTapToPayPlatformSupported()` when Android app ships |

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
1. App root: StripeTerminalAppProvider (connection token from registry while sheet is open)
2. Owner taps Tap to Pay on Complete sheet → TapToPaySheet mounts
3. POST …/connection-token (registry) + POST …/intent { sessionFees }
4. Terminal: easyConnect (tapToPay) → retrievePaymentIntent → processPaymentIntent
5. On SDK success → POST …/actions job_completed with tap_to_pay + stripePaymentIntentId
6. On 200 → success UI → sheet closes
```

If the owner **adds or edits a fee** on the Complete sheet, local tap state is cleared; the next Tap to Pay session sends the updated `sessionFees`.

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

| Phase                    | UI                                                                      |
| ------------------------ | ----------------------------------------------------------------------- |
| `loading_intent`         | Spinner — preparing payment                                             |
| `pending`                | “Hold their card…” / “Ready to accept payment”                          |
| `success`                | “Payment received” → auto-dismiss                                       |
| `intent_error` / `error` | Inline hint + **Try again** (Complete sheet still has **Mark as paid**) |
| Connect not ready (422)  | Tap to Pay opens setup sheet → **Set up payments** → Payments           |

---

## Connect gating on Complete sheet

Before Tap to Pay collection, mobile reads `payment_accounts` (same rule as Payments tab):

| Connect state                                                  | Tap to Pay button                                   | Mark as paid     |
| -------------------------------------------------------------- | --------------------------------------------------- | ---------------- |
| Not ready                                                      | Tap to Pay always tappable → setup sheet → Payments | Always available |
| Loading                                                        | Spinner on button                                   | Always available |
| Ready (`onboarding_status === 'complete'` + `charges_enabled`) | Active                                              | Always available |

Non‑Pro owners land on the Payments web upsell; Pro owners without Connect see the Stripe Connect setup card.

---

## Native iOS requirement (Tap to Pay on iPhone)

Server + Stripe Connect + Terminal Location are **not enough**. The **installed app binary** must include Apple’s Tap to Pay entitlement:

`com.apple.developer.proximity-reader.payment.acceptance`

Without it, Terminal `easyConnect` fails with `UNSUPPORTED_OPERATION` even when intent returns `terminalLocationId`.

**Checklist:**

1. [Apple Developer](https://developer.apple.com) → **Identifiers** → `com.jsanchdev.servicelinkmobile` → enable **Tap to Pay on iPhone** (Apple approval required).
2. `app.json` includes `@stripe/stripe-terminal-react-native` with `"tapToPayCheck": true`.
3. **New EAS iOS build** (Metro/OTA cannot add entitlements):

   ```bash
   EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios
   ```

4. Install on a **physical iPhone** (not Simulator, not Expo Go).
5. Metro success path: `terminal.connect.ok` → `terminal.process.start` (not `UNSUPPORTED_OPERATION`).

---

## Feature flags (`tap-to-pay/constants/tapToPayFeatureFlags.js`)

| Flag                             | Production      | Notes                                                    |
| -------------------------------- | --------------- | -------------------------------------------------------- |
| `TAP_TO_PAY_USE_SERVER_APIS`     | `true`          | connection-token + intent                                |
| `TAP_TO_PAY_USE_TERMINAL_SDK`    | `true`          | Requires dev client / store build                        |
| `TAP_TO_PAY_DEV_MOCK_COLLECTION` | off when SDK on | Mock collection in `__DEV__` only when SDK flag is false |

`isTapToPayUiEnabled()` — iOS only + server APIs + (SDK or dev mock).

---

## Mobile code map

| Concern                 | Path                                                                     |
| ----------------------- | ------------------------------------------------------------------------ |
| Feature barrel          | `tap-to-pay/index.js`                                                    |
| Complete sheet entry    | `booking-details/components/BookingCompleteInvoiceDesignSheet.jsx`       |
| Tap overlay             | `tap-to-pay/components/TapToPaySheet.jsx`                                |
| Intent + collection     | `tap-to-pay/hooks/useTapToPaySheet.js`                                   |
| Terminal SDK            | `tap-to-pay/hooks/useTapToPayTerminalCollection.js`                      |
| App-root provider       | `tap-to-pay/providers/StripeTerminalAppProvider.jsx`                     |
| HTTP                    | `tap-to-pay/api/postTapToPayConnectionToken.js`, `postTapToPayIntent.js` |
| Session fees            | `tap-to-pay/utils/buildTapToPaySessionFees.js`                           |
| Connect gating          | `tap-to-pay/hooks/useTapToPayConnectReadiness.js`                        |
| Dev logging             | `tap-to-pay/utils/logTapToPayDebug.js` (`[TapToPay]` in Metro)           |
| `job_completed` payload | `booking-details/utils/buildJobCompletedPayload.js`                      |
| Confirm hook            | `booking-details/hooks/useMarkBookingCompleteFlow.js`                    |

---

## Merchant education & awareness (iOS)

Two layers — do not conflate them:

| Layer                      | What                                                            | When                                                                    |
| -------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **ServiceLink explainer**  | `TapToPayHowItWorksSheet` — Complete → Tap to Pay checkout flow | Payments **How it works**; optional replay any time                     |
| **Apple system education** | `ProximityReaderDiscovery` “How to Tap” (card presentation)     | Once after connect; replay via **View demo** in How it works (Payments) |
| **What’s new**             | `APP_UPDATE_ANNOUNCEMENTS` — current headline feature only      | Once per announcement id on app open (iOS Tap to Pay entry today)       |

Payments **How it works** explains ServiceLink checkout; **View demo** replays Apple merchant education (do not open Apple education from the card button directly).

Dev reset: long-press version footnote on **More** clears seen What’s new + Apple education flags.

---

## Error mapping

HTTP errors use `mapTapToPayHttpError.js`. Prefer server `error` string when present.

| HTTP    | Typical copy                                         |
| ------- | ---------------------------------------------------- |
| **400** | Nothing to collect / validation                      |
| **409** | Mark work done before collecting payment             |
| **422** | Set up Stripe payments to use Tap to Pay             |
| **500** | Couldn’t start Tap to Pay. Try again or mark as paid |

Terminal `UNSUPPORTED_OPERATION` → “App build not Tap to Pay ready” (missing Apple entitlement).

---

## Tests

```bash
npm test -- --testPathPattern="tap-to-pay|buildJobCompletedPayload"
```

---

## Production checklist (after Apple approval)

- [ ] Tap to Pay on iPhone enabled on App ID
- [ ] EAS iOS production / TestFlight build with entitlement
- [ ] `EXPO_PUBLIC_WEB_APP_URL` points to production in release builds
- [ ] End-to-end on device: intent → card tap → `job_completed` → invoice/SMS
- [ ] Confirm **Mark as paid** still works when Tap to Pay fails

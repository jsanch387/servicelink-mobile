# Booking Complete (Phase 1) — server implementation guide

**Audience:** Backend / Next.js server implementers (paste this into your server agent as context)  
**Mobile repo:** `servicelink-mobile`  
**Status:** Database migrated. **Server Phase 1 shipped** (persist + invoice + `/i/{token}`). **Mobile wired** — see [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md).

**Related docs:**

| Doc                                                                                                                  | Purpose                                                       |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`BOOKING_JOB_LIFECYCLE_SERVER.md`](./BOOKING_JOB_LIFECYCLE_SERVER.md)                                               | Full lifecycle state machine; Cycle 1 `work_finished` shipped |
| [`MOBILE_SMS_AND_BOOKING_ACTIONS.md`](./MOBILE_SMS_AND_BOOKING_ACTIONS.md)                                           | Shared actions endpoint, SMS logging, response shapes         |
| [`BOOKING_JOB_STARTED_SERVER.md`](./BOOKING_JOB_STARTED_SERVER.md)                                                   | Prior action patterns                                         |
| [`../../../docs/sql/booking_complete_phase1_migration.sql`](../../../docs/sql/booking_complete_phase1_migration.sql) | Applied schema reference                                      |

---

## 1. What the owner sees (mobile — explain the feature)

After a field job, the owner progresses on **Home → Next Up**:

| Step | Mobile UI              | Server action (already shipped)                   |
| ---- | ---------------------- | ------------------------------------------------- |
| 1    | **On my way**          | `on_the_way`                                      |
| 2    | **Slide to start job** | `job_started`                                     |
| 3    | **Done** or **Skip**   | `work_finished` (`notify: true \| false`)         |
| 4    | **Mark complete**      | Opens **Complete** full-screen sheet              |
| 5    | Complete sheet         | Add fees, collect payment, tap **Complete**       |
| 6    | Success                | Next Up refreshes; customer gets SMS (this phase) |

### Complete sheet (mobile UI today)

The app already implements the checkout UX in `BookingCompleteInvoiceDesignSheet.jsx`:

1. **Line items** — service + add-ons from `bookings` (`service_price_cents`, `addon_details`)
2. **Add fee** — owner-entered extras (label + dollars); stored **in memory** until Complete
3. **Collect balance** (when amount due > 0):
   - **Tap to Pay** — UI exists; **Stripe collection is mock in Phase 1** (Phase 2)
   - **Mark as paid** — cash / payment app / other (owner attestation)
4. **Complete** button — **disabled until `amountDue === 0`**
5. Submitting overlay — owner waits on **one HTTP response** from server

**Mobile amount-due math (must match server):**

```text
subtotalCents =
  service_price_cents
  + sum(addon line cents from addon_details)
  + sum(sessionFees[].amountCents from request body)

amountDueCents =
  subtotalCents
  - paid_online_amount_cents          (from booking_payments)
  - sessionPayment.amountCents        (from request body, if present)
```

Mobile POSTs fees + session payment in the **`job_completed`** body via `buildJobCompletedPayload.js` → `postBookingAction.js`.

---

## 2. Endpoints — how many?

### Phase 1 (build now): **one endpoint**

| Method | Path                                             | Purpose                                                                                           |
| ------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `POST` | `/api/availability/bookings/{bookingId}/actions` | Extended **`job_completed`** — fees, payment, complete booking, invoice, review invite, SMS/email |

Same route as `on_the_way`, `job_started`, `work_finished`. Add a branch in the existing actions handler.

**Do not** add separate mobile endpoints for:

- Mark booking complete (Supabase direct update)
- Create invoice
- Send review invite (`POST …/review-invite`) — **bundle inside `job_completed`**
- Persist session fees one-by-one from the app

### Phase 2 (later): **one additional endpoint**

| Method | Path                                                       | Purpose                                                               |
| ------ | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `POST` | `/api/availability/bookings/{bookingId}/tap-to-pay/intent` | Create Stripe PaymentIntent on connected account before Tap to Pay UI |

Phase 1 can ship **without** this endpoint if Tap to Pay stays mock/disabled and owners use **Mark as paid** only.

### Public invoice page (web route, not mobile API)

| Method | Path                                           | Purpose                                                       |
| ------ | ---------------------------------------------- | ------------------------------------------------------------- |
| `GET`  | `/i/{publicToken}` or `/invoice/{publicToken}` | HTML invoice + review CTA (reads `booking_invoices` by token) |

Use **server-side rendering** with service role or a narrow public lookup. Do not expose invoice rows via Supabase anon client without a token check.

---

## 3. Security

### Mobile → actions API

| Requirement     | Detail                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------- |
| **Auth**        | `Authorization: Bearer <supabase_access_token>`                                                 |
| **Ownership**   | Booking must belong to the authenticated owner’s business (same check as other booking actions) |
| **HTTPS**       | Required in production (`EXPO_PUBLIC_WEB_APP_URL`)                                              |
| **Correlation** | Honor optional `X-Request-ID` header; echo in logs                                              |
| **Idempotency** | Safe to retry on network failure; completed booking → `200` duplicate, no double SMS            |

### Public invoice URL

- Opaque `public_token` (32+ hex chars) — unguessable
- No PII in URL path besides token
- Rate-limit token lookups
- Optional: token expires (not required Phase 1)

### Stripe (Phase 2)

- Verify `PaymentIntent` status `succeeded`, amount, currency, and connected account before accepting `job_completed` with `method: tap_to_pay`
- Never trust client-only “payment succeeded” without Stripe API verification

---

## 4. Database (already migrated)

### `booking_session_fee_lines`

Owner-added charges at complete time.

| Column                      | Notes                        |
| --------------------------- | ---------------------------- |
| `booking_id`, `business_id` | FKs                          |
| `label`, `amount_cents`     | From request `sessionFees[]` |
| `source`                    | `'owner_complete_screen'`    |
| `sort_order`                | Preserve request order       |

**Write timing:** Insert rows inside `job_completed` transaction (replace any prior lines for that booking if retrying before complete — normally none exist).

### `booking_payments` (extended columns)

| Column                                     | Set on `job_completed`                             |
| ------------------------------------------ | -------------------------------------------------- |
| `session_fees_total_cents`                 | Sum of inserted fee lines                          |
| `session_payment_method`                   | `cash` \| `payment_app` \| `other` \| `tap_to_pay` |
| `session_payment_amount_cents`             | From `sessionPayment.amountCents`                  |
| `session_payment_stripe_payment_intent_id` | When `tap_to_pay` (Phase 2)                        |
| `session_payment_recorded_at`              | `now()`                                            |
| `remaining_amount_cents`                   | `0`                                                |
| `payment_status`                           | `paid` (or your canonical settled value)           |
| `total_amount_cents`                       | Recomputed subtotal including session fees         |

Ensure a `booking_payments` row exists for owner-created bookings (public booking pipeline already creates one).

### `booking_invoices`

One row per booking (v1). **Table name is `booking_invoices`** even though customer SMS may say “receipt” colloquially.

| Column                                        | Purpose                                                            |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `public_token`                                | URL segment for public HTML page                                   |
| `snapshot_json`                               | Immutable lines + payment breakdown at issue (fast render, no PDF) |
| `subtotal_cents`, `total_cents`, `paid_cents` | Denormalized totals                                                |
| `status`                                      | `'paid'` when job completes with zero balance                      |
| `invoice_number`                              | Optional Phase 2 (per-business sequence)                           |

**Performance:** INSERT + JSON snapshot only on the critical path. No PDF generation blocking the HTTP response.

---

## 5. `job_completed` handler — step-by-step

Implement inside `POST /api/availability/bookings/{id}/actions` when `action === 'job_completed'`.

### 5.1 Request body

```json
{
  "action": "job_completed",
  "sessionFees": [
    { "label": "Pet hair removal", "amountCents": 2500 },
    { "label": "Extra vacuum", "amountCents": 1500 }
  ],
  "sessionPayment": {
    "method": "cash",
    "amountCents": 12000
  }
}
```

| Field                                  | Required             | Rules                                                                 |
| -------------------------------------- | -------------------- | --------------------------------------------------------------------- |
| `action`                               | Yes                  | `"job_completed"`                                                     |
| `sessionFees`                          | No                   | Default `[]`. Each item: non-empty `label`, `amountCents` integer ≥ 0 |
| `sessionPayment`                       | No                   | Omit when customer already paid in full online                        |
| `sessionPayment.method`                | When payment present | `cash` \| `payment_app` \| `other` \| `tap_to_pay`                    |
| `sessionPayment.amountCents`           | When payment present | Integer ≥ 0                                                           |
| `sessionPayment.stripePaymentIntentId` | When `tap_to_pay`    | Verify with Stripe (Phase 2)                                          |

### 5.2 Validation (fail fast)

| Check                              | HTTP           | Error                                     |
| ---------------------------------- | -------------- | ----------------------------------------- |
| Not authenticated                  | `401`          | Sign in message                           |
| Booking not found / wrong business | `404`          | Not found                                 |
| `job_status !== 'in_progress'`     | `409`          | Invalid transition                        |
| `work_handoff_status` is NULL      | `409`          | Owner must Done/Skip first                |
| Recomputed `amountDueCents > 0`    | `400` or `409` | `"Payment is still due on this booking."` |
| Already `completed`                | `200`          | Idempotent success (§5.6)                 |

### 5.3 Amount due (server source of truth)

```typescript
// Pseudocode
const serviceCents = booking.service_price_cents ?? 0;
const addonCents = sumAddonDetails(booking.addon_details);
const sessionFeeCents = sum(sessionFees.map((f) => f.amountCents));
const subtotalCents = serviceCents + addonCents + sessionFeeCents;

const paidOnlineCents = bookingPayments?.paid_online_amount_cents ?? 0;
const sessionPayCents = sessionPayment?.amountCents ?? 0;

const amountDueCents = subtotalCents - paidOnlineCents - sessionPayCents;
```

Reject if `amountDueCents > 0`. Allow `amountDueCents === 0` when `sessionPayment` omitted (paid online in full, no extra fees).

### 5.4 Persist (single transaction)

1. INSERT `booking_session_fee_lines` from `sessionFees[]`
2. UPSERT/update `booking_payments` session columns + zero remaining balance
3. UPDATE `bookings`: `job_status = 'completed'`, `status = 'completed'`
4. INSERT `booking_invoices` with `snapshot_json` (lines, payments, customer, business branding refs)
5. Create **review invite** row if eligible (reuse existing review-invite logic internally — **do not** require a second HTTP call from mobile)
6. Commit

### 5.5 Customer notification (after persist)

**One** outbound message per completion:

| Priority   | Channel | Condition                          |
| ---------- | ------- | ---------------------------------- |
| 1          | SMS     | Valid phone on booking             |
| 2          | Email   | SMS failed/skipped and valid email |
| Never both | —       | Same event                         |

**SMS `type`:** `job_completed` (allowlisted in `sms_messages`)

**Suggested SMS copy:**

> Thanks from {BusinessName}! View your invoice and leave a review: {shortLink}

`{shortLink}` → public invoice page (`/i/{public_token}`) which also surfaces review CTA. Product may use customer-friendly “receipt” in SMS while DB stays `booking_invoices`.

**If customer already reviewed:** thank-you only, no review link.

**Golden rule (same as other actions):** SMS failure does **not** roll back completion. Return `200` with `sms.sent: false` and `sms.reason`.

### 5.6 Idempotency

If booking already completed:

- Return **`200`**, `jobStatus: 'completed'`, `bookingStatus: 'completed'`
- `sms.reason: 'duplicate'` (or omit send)
- Do not duplicate fee lines or invoices

### 5.7 Success response

```json
{
  "success": true,
  "action": "job_completed",
  "jobStatus": "completed",
  "bookingStatus": "completed",
  "workHandoffStatus": "notified",
  "invoicePublicToken": "abc123...",
  "sms": { "sent": true, "messageId": "<uuid>", "reason": null },
  "email": { "sent": false, "messageId": null, "reason": null }
}
```

Mobile parser (`postBookingAction.js`) reads `jobStatus`, `bookingStatus`, `workHandoffStatus`, `invoicePublicToken`, `sms`, and `email`.

Use **camelCase** keys; mobile also accepts snake_case for some fields on other actions.

### 5.8 Error response

Same envelope as existing actions:

```json
{
  "success": false,
  "error": "Payment is still due on this booking."
}
```

| HTTP  | When                                |
| ----- | ----------------------------------- |
| `400` | Bad payload, payment still due      |
| `401` | Missing/invalid JWT                 |
| `404` | Booking not found                   |
| `409` | Wrong `job_status`, handoff pending |
| `429` | Rate limit — honor `Retry-After`    |
| `500` | Unexpected error                    |

---

## 6. Public invoice page (Phase 1 HTML)

**Goal:** Fast first paint; no PDF on complete path.

1. Lookup `booking_invoices` by `public_token`
2. Render HTML from `snapshot_json` + business name/logo
3. Show line items, fees, payments, amount paid
4. Prominent **Leave a review** button/link (same eligibility rules as review invite)

**Do not** block `job_completed` HTTP response on rendering this page — only on INSERT of invoice row + token.

---

## 7. Mobile wiring (shipped)

| Step                                                       | Status                                                | Location                                            |
| ---------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| Build `sessionFees` + `sessionPayment` from Complete sheet | Done                                                  | `booking-details/utils/buildJobCompletedPayload.js` |
| Extend `postBookingAction(JOB_COMPLETED, …)`               | Done                                                  | `api/postBookingAction.js`                          |
| `confirmComplete(checkout)` sends full payload             | Done                                                  | `useMarkBookingCompleteFlow.js`                     |
| On `200`: patch caches, toast, close sheet                 | Done                                                  | same hook + `bookingActionFeedback.js`              |
| Legacy `completeBookingWithReviewInvite`                   | Skipped when `MARK_COMPLETE_USE_JOB_COMPLETED_ACTION` | feature flag                                        |

**Mobile contract:** [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md)

---

## 8. Phase 2 preview (do not block Phase 1)

1. `POST …/tap-to-pay/intent` → Stripe PaymentIntent
2. Mobile Stripe Terminal SDK replaces mock Tap to Pay
3. `job_completed` verifies `stripePaymentIntentId`
4. Optional: `invoice_number` sequences, PDF export, Stripe Invoice sync

---

## 9. Implementation checklist (server agent)

```
[x] Extend actions router: job_completed branch
[x] Load booking + booking_payments + verify owner
[x] Validate work_handoff_status + job_status
[x] Compute amount due; reject if > 0
[x] Transaction: fee lines, payments, booking complete, booking_invoices row
[x] Internal review invite creation (no separate mobile POST)
[x] SMS job_completed with invoice public link (+ email fallback)
[x] Idempotent completed booking handling
[x] GET public invoice page by public_token
[ ] Staging curl tests (see below)
[x] Log X-Request-ID + booking id on all paths
```

---

## 10. Staging curl examples

Replace `$ORIGIN`, `$TOKEN`, `$BOOKING_ID`.

**Mark complete with fee + cash payment:**

```bash
curl -sS -X POST "$ORIGIN/api/availability/bookings/$BOOKING_ID/actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $(uuidgen)" \
  -d '{
    "action": "job_completed",
    "sessionFees": [{ "label": "Pet hair", "amountCents": 2500 }],
    "sessionPayment": { "method": "cash", "amountCents": 14500 }
  }'
```

**Paid online in full, no session payment (fees only or none):**

```bash
curl -sS -X POST "$ORIGIN/api/availability/bookings/$BOOKING_ID/actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "action": "job_completed", "sessionFees": [] }'
```

**Precondition for tests:** booking at `job_status = in_progress`, `work_handoff_status IN ('notified','skipped')`, and amount-due math matches payload.

---

## 11. Explicit non-goals (Phase 1)

- PDF invoices
- Stripe Invoice objects
- Separate mobile endpoint per fee or payment step
- Mobile Supabase `UPDATE bookings SET status = completed` when feature flag is on
- Mobile `POST …/review-invite` after `job_completed`
- Blocking completion on slow third-party calls (queue SMS if needed, but return `200` once DB commit succeeds)

---

## 12. Mobile file map (for server debugging)

| File                                                               | Role                                      |
| ------------------------------------------------------------------ | ----------------------------------------- |
| `home/components/NextUpCard.jsx`                                   | Mark complete entry                       |
| `home/screens/HomeScreen.jsx`                                      | Wires Complete sheet + confirm            |
| `booking-details/components/BookingCompleteInvoiceDesignSheet.jsx` | Fees, tap to pay, mark paid, Complete CTA |
| `booking-details/hooks/useMarkBookingCompleteFlow.js`              | Opens sheet, calls `postBookingAction`    |
| `bookings/api/postBookingAction.js`                                | HTTP client for actions endpoint          |
| `bookings/utils/bookingActionFeedback.js`                          | Success/error toasts                      |
| `bookings/docs/BOOKING_JOB_LIFECYCLE_SERVER.md`                    | Master lifecycle contract                 |

When staging is ready, verify against [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md) curl smoke test.

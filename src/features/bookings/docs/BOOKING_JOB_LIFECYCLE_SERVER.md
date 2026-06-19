# Booking job lifecycle — server contract (mobile → Next.js)

**Audience:** backend / server implementers + mobile integrators  
**Status:** **Cycle 1 shipped** — mobile production is wired for `work_finished` (Done / Skip on Home → Next Up). **Cycle 2 pending** — extended `job_completed` payload (Complete screen: session fees, Tap to Pay, receipt + review SMS).

**Related docs:**

- [`MOBILE_SMS_AND_BOOKING_ACTIONS.md`](./MOBILE_SMS_AND_BOOKING_ACTIONS.md) — SMS logging, shared response shapes, cache behavior
- [`BOOKING_JOB_STARTED_SERVER.md`](./BOOKING_JOB_STARTED_SERVER.md) — `job_started` detail
- [`BOOKING_JOB_COMPLETED_SERVER.md`](./BOOKING_JOB_COMPLETED_SERVER.md) — legacy `job_completed` summary (superseded by §6 here for the Complete screen)

---

## 1. Product summary (what mobile designed)

Field owners move a confirmed booking through these **owner-facing** steps on **Home → Next Up**:

| Step | Mobile UI                                                                | Customer notification                                                        |
| ---- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1    | **On my way**                                                            | SMS only                                                                     |
| 2    | **Slide to start job**                                                   | SMS only                                                                     |
| 3    | **Done** or **Skip** (while job is in progress)                          | SMS only on **Done**; **Skip** = no message                                  |
| 4    | **Mark complete** → **Complete** screen (fees, Tap to Pay, Mark as paid) | —                                                                            |
| 5    | **Complete** (only when balance is $0)                                   | **One** SMS with **receipt + review link** (email fallback on complete only) |

**Rules agreed with mobile:**

- **Job progression** (`on_the_way`, `job_started`, `work_finished`) → **SMS only**. No live email for these steps.
- **Complete** (`job_completed`) → SMS first for receipt + review; email fallback if no phone or SMS fails. Never both channels for the same completion event.
- **Payment before complete** — mobile disables **Complete** until `amountDue === 0`. Server must **reject** `job_completed` if money is still owed.
- **Phone on new bookings** — required when creating appointments (owner flow already validates). Email optional. Legacy rows without a phone: mobile disables progression SMS buttons; **Mark complete** remains a safeguard.

---

## 2. State machine

### 2.1 `bookings.job_status` (existing column)

```
not_started  →  on_the_way  →  in_progress  →  completed
```

| Value         | Meaning                                          |
| ------------- | ------------------------------------------------ |
| `not_started` | Default; owner has not tapped **On my way**      |
| `on_the_way`  | Owner is en route                                |
| `in_progress` | Owner started the service on site                |
| `completed`   | Owner finished admin close-out (`job_completed`) |

`bookings.status` stays `confirmed` until `job_completed`, then becomes `completed`.

### 2.2 **New:** `bookings.work_handoff_status` (required)

While `job_status = in_progress`, mobile needs to know whether to show **Done / Skip** or **Mark complete**.

| Column                | Type            | Values                                |
| --------------------- | --------------- | ------------------------------------- |
| `work_handoff_status` | `text` nullable | `NULL` \| `'notified'` \| `'skipped'` |

| `job_status`  | `work_handoff_status`   | Next Up actions     |
| ------------- | ----------------------- | ------------------- |
| `in_progress` | `NULL`                  | **Done** + **Skip** |
| `in_progress` | `notified` or `skipped` | **Mark complete**   |
| `completed`   | (any)                   | None                |

**Semantics:**

- **`notified`** — owner tapped **Done**; server sent `work_finished` SMS (or attempted; state still advances).
- **`skipped`** — owner tapped **Skip**; no SMS.
- Reset `work_handoff_status` to `NULL` when re-opening a job is not supported (no un-complete). New bookings start `NULL`.

**Migration example:**

```sql
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS work_handoff_status text
    CHECK (work_handoff_status IS NULL OR work_handoff_status IN ('notified', 'skipped'));

COMMENT ON COLUMN bookings.work_handoff_status IS
  'Owner handoff step while job_status=in_progress: NULL=pending Done/Skip, notified=SMS sent, skipped=no SMS';
```

### 2.3 Mobile reads (extend existing selects)

Include in home spotlight + booking details queries:

```
job_status, work_handoff_status, customer_phone, customer_email, …
```

Mobile will map:

- `in_progress` + `work_handoff_status IS NULL` → handoff UI (**Done** / **Skip**)
- `in_progress` + `work_handoff_status IS NOT NULL` → **Mark complete**

---

## 3. Customer phone policy

| Context                  | Rule                                                                                                                                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner create appointment | **Phone required** (10-digit US NANP). Email optional. Enforce on `POST /api/public/bookings` for owner + public flows.                                                                                                                                                                  |
| Legacy booking, no phone | Progression actions disabled in mobile. Server should return **`409`** or **`400`** with a clear message if `on_the_way` / `job_started` / `work_finished` with `notify: true` is called without a sendable phone. **`work_finished` with `notify: false` (Skip)** should still succeed. |
| Navigate                 | Address-only; no phone needed (mobile only).                                                                                                                                                                                                                                             |

Normalize to **E.164** at send time. Log every attempt in `sms_messages`.

---

## 4. Endpoint (unchanged path)

| Item   | Value                                            |
| ------ | ------------------------------------------------ |
| Method | `POST`                                           |
| Path   | `/api/availability/bookings/{bookingId}/actions` |
| Origin | `EXPO_PUBLIC_WEB_APP_URL`                        |

### Headers

```
Authorization: Bearer <supabase_session.access_token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>   (optional; mobile sends one)
```

### Request body (base)

```json
{ "action": "<action_name>" }
```

Extended bodies in §5–§6.

---

## 5. Job progression actions (SMS only)

**Golden rule:** persist state first; SMS best-effort second. Failed SMS does **not** roll back state. Return `200` with `sms.sent: false` and `sms.reason`.

### 5.1 `on_the_way`

|                       |                                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **From**              | `not_started` (server may allow skip-ahead from `not_started` → `in_progress` if product allows; mobile expects happy path) |
| **To**                | `job_status = on_the_way`                                                                                                   |
| **`bookings.status`** | `confirmed` (unchanged)                                                                                                     |
| **SMS `type`**        | `on_the_way`                                                                                                                |

**Suggested SMS template:**

> {BusinessName} is on the way for your appointment.

**Request:**

```json
{ "action": "on_the_way" }
```

**Success response:**

```json
{
  "success": true,
  "action": "on_the_way",
  "jobStatus": "on_the_way",
  "workHandoffStatus": null,
  "sms": { "sent": true, "messageId": "<uuid>", "reason": null }
}
```

---

### 5.2 `job_started`

|                |                                                          |
| -------------- | -------------------------------------------------------- |
| **From**       | `on_the_way`                                             |
| **To**         | `job_status = in_progress`, `work_handoff_status = NULL` |
| **SMS `type`** | `job_started`                                            |

**Suggested SMS template:**

> {BusinessName} has started your service.

**Request:**

```json
{ "action": "job_started" }
```

**Success response:**

```json
{
  "success": true,
  "action": "job_started",
  "jobStatus": "in_progress",
  "workHandoffStatus": null,
  "sms": { "sent": true, "messageId": "<uuid>", "reason": null }
}
```

---

### 5.3 `work_finished` (new)

Owner finished physical work; optional customer ping before payment / close-out.

|          |                                                                               |
| -------- | ----------------------------------------------------------------------------- |
| **From** | `in_progress` AND `work_handoff_status IS NULL`                               |
| **To**   | `job_status` stays `in_progress`; `work_handoff_status = notified \| skipped` |
| **SMS**  | Only when `notify: true`                                                      |

**Request:**

```json
{
  "action": "work_finished",
  "notify": true
}
```

| `notify` | Server behavior                                  |
| -------- | ------------------------------------------------ |
| `true`   | Send SMS; set `work_handoff_status = 'notified'` |
| `false`  | No SMS; set `work_handoff_status = 'skipped'`    |

**Suggested SMS template (`notify: true`):**

> {BusinessName} has finished your service. Come take a look when you're ready.

**SMS `type`:** `work_finished` (add to `sms_messages.type` enum / allowlist)

**Success response:**

```json
{
  "success": true,
  "action": "work_finished",
  "jobStatus": "in_progress",
  "workHandoffStatus": "notified",
  "sms": { "sent": true, "messageId": "<uuid>", "reason": null }
}
```

**Skip example (`notify: false`):**

```json
{
  "success": true,
  "action": "work_finished",
  "jobStatus": "in_progress",
  "workHandoffStatus": "skipped",
  "sms": { "sent": false, "messageId": null, "reason": null }
}
```

**Idempotency:** If `work_handoff_status` is already set, return **`200`** with current state and `sms.reason = "duplicate"` (do not re-send SMS).

**Conflicts:**

| Case                          | HTTP                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Not `in_progress`             | `409`                                                                                                             |
| No phone + `notify: true`     | `409` or `400` with `"error": "No phone on file for this booking."` (mobile disables button; this is a safeguard) |
| Booking completed / cancelled | `409`                                                                                                             |

---

## 6. `job_completed` — Complete screen + close-out

Mobile opens a full-screen **Complete** flow before calling the server:

1. Line items (service + add-ons from booking)
2. Optional **session fees** added on site
3. **Tap to Pay** (Stripe) or **Mark as paid** (cash / payment app / other)
4. **Complete** button enabled only when **amount due = $0**
5. On success → server sends **one** completion message (receipt + review)

### 6.1 Request body (extended)

```json
{
  "action": "job_completed",
  "sessionFees": [{ "label": "Pet hair removal", "amountCents": 2500 }],
  "sessionPayment": {
    "method": "tap_to_pay",
    "amountCents": 14500,
    "stripePaymentIntentId": "pi_xxx"
  }
}
```

| Field                                  | Required             | Notes                                                                                                          |
| -------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `sessionFees`                          | No                   | Array of extra charges added on site. Persist on booking / invoice tables.                                     |
| `sessionPayment`                       | No                   | Present when owner collected balance in the Complete screen this session. Omit if already paid online in full. |
| `sessionPayment.method`                | When payment present | `tap_to_pay` \| `cash` \| `payment_app` \| `other`                                                             |
| `sessionPayment.amountCents`           | When payment present | Integer ≥ 0                                                                                                    |
| `sessionPayment.stripePaymentIntentId` | When `tap_to_pay`    | Verify succeeded via Stripe before accepting complete                                                          |

**Server-side validation (required):**

1. `job_status = in_progress` and `work_handoff_status IN ('notified', 'skipped')` (handoff done). Return **`409`** if handoff still pending — owner must **Done** or **Skip** first.
2. Recompute **amount due** from stored pricing + `sessionFees` − deposits − online payments − `sessionPayment` − prior session payments.
3. If **amount due > 0** → **`409`** or **`400`**: `"Payment is still due on this booking."` (mobile already blocks UI; server is source of truth).
4. Set `job_status = completed` and `status = completed`.
5. Run post-completion side effects (maintenance, analytics, etc.).
6. Send **one** customer notification (§6.3).
7. Mobile must **not** call `POST …/review-invite` after this when using the actions path.

### 6.2 Payment / fee persistence (suggested)

Server owns canonical money state. Minimum:

| Data         | Suggestion                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| Session fees | `booking_fee_lines` or jsonb on `bookings` / `booking_checkout`                                       |
| Tap to Pay   | Tie to existing Stripe PaymentIntent; store `stripe_payment_intent_id`, `amount_cents`, `captured_at` |
| In-person    | `session_payment_method`, `session_payment_amount_cents` on booking or `booking_payments` row         |

Mobile today keeps fees/payments **in memory** until Complete; after integration it will POST them in this body. Until Tap to Pay is live, mobile may send only `sessionFees` + `sessionPayment` for **Mark as paid** paths.

### 6.3 Completion notification (receipt + review)

**Not** the same as `work_finished`. This is the only message that includes **receipt** and **review link**.

| Priority   | Channel | When                                       |
| ---------- | ------- | ------------------------------------------ |
| 1          | SMS     | Customer has sendable phone                |
| 2          | Email   | SMS skipped/failed and valid email on file |
| Never both | —       | One completion notification per booking    |

**SMS `type`:** `job_completed` (or `receipt_and_review` if you split types)

**Suggested SMS (not yet reviewed):**

> Thanks from {BusinessName}! View your receipt and leave a review: {shortLink}

Link should include receipt **and** review (single URL or single SMS — product choice on server).

**If already reviewed:** plain thank-you SMS (no review link).

**Email fallback:** receipt + review link (Resend). `email.reason` when skipped.

**Idempotency:** Repeat `job_completed` on completed booking → **`200`**, `jobStatus: completed`, `sms.reason: duplicate`, do not re-send.

### 6.4 Success response

```json
{
  "success": true,
  "action": "job_completed",
  "jobStatus": "completed",
  "bookingStatus": "completed",
  "workHandoffStatus": "notified",
  "sms": { "sent": true, "messageId": "<uuid>", "reason": null },
  "email": { "sent": false, "messageId": null, "reason": null }
}
```

| Field               | Notes                                              |
| ------------------- | -------------------------------------------------- |
| `jobStatus`         | Prefer camelCase; mobile also accepts `job_status` |
| `bookingStatus`     | `"completed"`                                      |
| `workHandoffStatus` | Echo final value; mobile may ignore                |
| `sms` / `email`     | Same shape as existing contract                    |

After **`200`**, mobile will:

- Patch caches with `jobStatus` + `bookingStatus`
- Invalidate home + details queries → Next Up shows **next** confirmed booking or empty
- Show toast from `sms` / `email` outcome
- Close Complete screen

---

## 7. `sms_messages.type` allowlist (additions)

| `type`                 | When                             |
| ---------------------- | -------------------------------- |
| `on_the_way`           | Existing                         |
| `job_started`          | Existing                         |
| `work_finished`        | **New** — Done button            |
| `job_completed`        | Complete — receipt + review SMS  |
| `booking_confirmation` | Existing (public booking create) |

Job progression types are **SMS only** (no email rows for `on_the_way`, `job_started`, `work_finished`).

---

## 8. SMS skip reasons (unchanged)

When `sms.sent = false`, `sms.reason` ∈:

`no_phone` | `invalid_number` | `duplicate` | `not_configured` | `error`

Email on complete only: `email.reason` ∈ `no_email` | `duplicate` | `not_configured` | `error` | `null`

---

## 9. HTTP errors (all actions)

```json
{ "success": false, "error": "<English message>" }
```

| HTTP  | When                                                                        |
| ----- | --------------------------------------------------------------------------- |
| `400` | Invalid body / unknown action                                               |
| `401` | Not authenticated                                                           |
| `404` | Booking not found or wrong business                                         |
| `409` | Invalid transition, handoff pending, payment still due, no phone for notify |
| `429` | Rate limit — honor `Retry-After`                                            |
| `500` | Server error                                                                |

Failed SMS alone is **never** a non-2xx HTTP response.

---

## 10. Integration checklist

### Cycle 1 — `work_finished` (done)

**Server (required):**

- [x] Migration: `work_handoff_status` column + backfill `NULL` for active `in_progress` jobs
- [x] `work_finished` action with `notify` boolean
- [x] All booking list/detail selects return `work_handoff_status`
- [x] Staging curl examples verified

**Mobile (shipped):**

| Task                                  | File(s)                                                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `WORK_FINISHED` action constant       | `constants/jobStatus.js`                                                                                         |
| Done / Skip → `work_finished`         | `NextUpCard.jsx`, `useBookingAction.js`                                                                          |
| Handoff UI from `work_handoff_status` | `resolveNextUpCardActions.js`, `NextUpCard.jsx`                                                                  |
| Cache patch + toasts                  | `patchBookingJobStatusIn*Cache.js`, `bookingActionFeedback.js`                                                   |
| Tests                                 | `postBookingAction.test.js`, `bookingActionFeedback.test.js`, `NextUpCard.test.jsx`, `useBookingAction.test.jsx` |

**Mobile quick reference:** [`MOBILE_BOOKING_ACTIONS.md`](./MOBILE_BOOKING_ACTIONS.md)

### Cycle 2 — Complete screen + `job_completed` (next)

**Server (pending):**

- [ ] `job_completed` validates handoff + zero balance; accepts `sessionFees` + `sessionPayment`
- [ ] Completion SMS/email copy uses **receipt** (not invoice) + review link

**Mobile (pending):**

| Task                                                 | File(s)                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| POST extended `job_completed` body                   | `postBookingAction.js`, `useMarkBookingCompleteFlow.js`      |
| Tap to Pay → Stripe PI id in `sessionPayment`        | `tap-to-pay/` feature                                        |
| Turn off lifecycle design preview when Cycle 2 ships | `nextUpDesignFlags.js`, `useNextUpLifecycleDesignPreview.js` |

**Feature flags today (mobile):**

- `MARK_COMPLETE_USE_JOB_COMPLETED_ACTION = true`
- `MARK_COMPLETE_USE_COMPLETE_VISIT_SCREEN = true`
- `NEXT_UP_LIFECYCLE_DESIGN_PREVIEW = true` (dev-only mock path — remove after Cycle 2)

---

## 11. curl examples (staging)

**On my way:**

```bash
curl -sS -X POST "$ORIGIN/api/availability/bookings/$BOOKING_ID/actions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"on_the_way"}'
```

**Work finished (Done — notify):**

```bash
curl -sS -X POST "$ORIGIN/api/availability/bookings/$BOOKING_ID/actions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"work_finished","notify":true}'
```

**Complete (with fee + in-person payment):**

```bash
curl -sS -X POST "$ORIGIN/api/availability/bookings/$BOOKING_ID/actions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "job_completed",
    "sessionFees": [{ "label": "Extra soil", "amountCents": 1500 }],
    "sessionPayment": { "method": "cash", "amountCents": 13500 }
  }'
```

---

## 12. Summary table

| `action`                          | `job_status` after | `work_handoff_status` after | SMS                  | Email         |
| --------------------------------- | ------------------ | --------------------------- | -------------------- | ------------- |
| `on_the_way`                      | `on_the_way`       | unchanged (`NULL`)          | Yes                  | No            |
| `job_started`                     | `in_progress`      | `NULL`                      | Yes                  | No            |
| `work_finished` + `notify: true`  | `in_progress`      | `notified`                  | Yes                  | No            |
| `work_finished` + `notify: false` | `in_progress`      | `skipped`                   | No                   | No            |
| `job_completed`                   | `completed`        | unchanged                   | Yes (receipt+review) | Fallback only |

---

_Last updated to match mobile design preview (Next Up lifecycle + Complete screen) — integrate server first, then wire mobile against this document._

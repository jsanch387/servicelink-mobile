# Contract: Mobile — SMS notifications, message history & booking actions

This doc covers, for the native app:

1. **How customer phone numbers are stored** and normalized.
2. **The SMS data model** (`sms_messages`) — how every text is logged and how the app reads "messages sent" history.
3. **Job tracking** (`bookings.job_status`) — the stateful fulfillment lifecycle of a booking.
4. **The booking actions endpoint** — one generic, data-driven endpoint that drives a job-status transition **and** sends the matching customer SMS (`on_the_way`, `job_started`, `work_finished`, `job_completed`, …).

> **Mobile integration (Done / Skip, toasts, cache):** see **[`MOBILE_BOOKING_ACTIONS.md`](./MOBILE_BOOKING_ACTIONS.md)** and **[`BOOKING_JOB_LIFECYCLE_SERVER.md`](./BOOKING_JOB_LIFECYCLE_SERVER.md)** §5.3.

> **Golden rule:** the app never calls Pingram or sends SMS directly. The server holds the API key, normalizes numbers, enforces ownership, rate-limits (SMS costs money), logs every send, owns the message templates, and owns the state machine. The app triggers **actions** and **reads state**.

---

## 1. How phone numbers are saved

- A booking stores the customer's number in **`bookings.customer_phone`** (free-form text, exactly as entered). It may be empty.
- The app does **not** need to format numbers. The server normalizes to **E.164** at send time.
- If a booking has no usable phone, the action still runs (the **state still changes**) but no SMS is sent — the response reports `sms.sent = false` (see §4).

Owner-created bookings and customer self-serve bookings both flow through `POST /api/public/bookings`; if a phone is present, the **booking confirmation SMS** is sent + logged automatically there. The app does not trigger confirmations.

---

## 2. SMS data model — `sms_messages`

Every outbound SMS attempt is a row in **`public.sms_messages`**. This is the source of truth for a future "messages sent" screen.

| Column                   | Type          | Notes                                                                                                                      |
| ------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | uuid          | —                                                                                                                          |
| `business_id`            | uuid          | tenancy / RLS scope                                                                                                        |
| `booking_id`             | uuid \| null  | links the message to an appointment                                                                                        |
| `customer_id`            | uuid \| null  | links to the customer                                                                                                      |
| `type`                   | text          | `booking_confirmation` \| `on_the_way` \| `job_started` \| `work_finished` \| `job_completed` \| `reminder` \| `invoice` … |
| `channel`                | text          | `sms`                                                                                                                      |
| `direction`              | text          | `outbound`                                                                                                                 |
| `to_phone`               | text          | E.164 number actually used                                                                                                 |
| `body`                   | text          | exact message sent (display this in history)                                                                               |
| `status`                 | text          | `queued` \| `sent` \| `delivered` \| `failed` \| `undelivered` \| `skipped_opt_out`                                        |
| `provider`               | text          | `pingram`                                                                                                                  |
| `provider_message_id`    | text \| null  | provider id                                                                                                                |
| `error`                  | text \| null  | failure reason                                                                                                             |
| `dedupe_key`             | text \| null  | server idempotency key; ignore on the client                                                                               |
| `metadata`               | jsonb \| null | extensible                                                                                                                 |
| `created_at` / `sent_at` | timestamptz   | —                                                                                                                          |

**RLS:** the owner can **read** rows for their own business. The app may `SELECT` directly from Supabase. The app may **not** insert/update — all writes are server-side.

### Reading message history (future UI)

```sql
select id, type, body, status, to_phone, sent_at, created_at, booking_id
from sms_messages
where business_id = '<businessId>'
order by created_at desc;
```

---

## 3. Job tracking — `bookings.job_status`

```
not_started  ->  on_the_way  ->  in_progress  ->  completed
```

- Always include `job_status` in booking `SELECT`s (`BOOKING_LIST_SELECT`, `BOOKING_DETAILS_SELECT`).
- The app transitions `job_status` **only** through the actions endpoint; it never writes `job_status` directly (except optimistic cache patches from the action response).

### Which button to show (mobile)

| Current `job_status` | Mobile UI                             | Action          |
| -------------------- | ------------------------------------- | --------------- |
| `not_started`        | Next Up → **On my way**               | `on_the_way`    |
| `on_the_way`         | Next Up → **Slide to start job**      | `job_started`   |
| `in_progress`        | Next Up / Details → **Mark complete** | `job_completed` |
| `completed`          | No job actions                        | —               |

Server may allow skip-ahead transitions (e.g. `job_started` from `not_started`).

---

## 4. Booking actions endpoint

|            |                                                                     |
| ---------- | ------------------------------------------------------------------- |
| **Method** | `POST`                                                              |
| **Path**   | `/api/availability/bookings/{bookingId}/actions`                    |
| **Origin** | `EXPO_PUBLIC_WEB_APP_URL` via `resolveStripeMobileCheckoutOrigin()` |

> The old `POST …/on-my-way` route is **removed**. Use `…/actions` with `{ "action": "on_the_way" }`.

### Available actions

| `action`        | Moves `job_status` to | Customer notification                                                          |
| --------------- | --------------------- | ------------------------------------------------------------------------------ |
| `on_the_way`    | `on_the_way`          | SMS: "{Business} is on the way for your appointment."                          |
| `job_started`   | `in_progress`         | SMS: "{Business} has started your service."                                    |
| `job_completed` | `completed`           | **One** completion notification — review SMS first, email fallback (see below) |

### Authentication

```
Authorization: Bearer <Supabase session access_token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>   (optional; mobile sends one)
```

### Request body

```json
{ "action": "on_the_way" }
```

### Semantics — state first, SMS second

1. The `job_status` transition is authoritative and is applied race-safely.
2. Customer SMS/email is **best-effort after** the transition. Failed notification does **not** roll back state.
3. **`job_completed` only:** server also sets `bookings.status = 'completed'`, runs maintenance side effects, and sends the **single** completion notification. Mobile must **not** call `/review-invite` or legacy Supabase complete when `MARK_COMPLETE_USE_JOB_COMPLETED_ACTION` is on.

### `job_completed` completion notification

- **SMS (primary):** invoice link at `/i/{invoicePublicToken}` + review CTA when eligible
- **Email (fallback):** same intent, only if SMS skipped/failed — **never both**
- **Already reviewed:** thank-you only, no review link
- **Idempotent:** repeat `job_completed` on an already-completed booking returns **200** with `sms.reason = "duplicate"` and existing `invoicePublicToken`

### Success response

```json
{
  "success": true,
  "action": "on_the_way",
  "jobStatus": "on_the_way",
  "sms": { "sent": true, "messageId": "<sms_messages.id>", "reason": null }
}
```

**`job_completed`** additionally includes `bookingStatus`, `workHandoffStatus`, `invoicePublicToken`, and **always** both `sms` and `email` blocks:

```json
{
  "success": true,
  "action": "job_completed",
  "jobStatus": "completed",
  "bookingStatus": "completed",
  "workHandoffStatus": "notified",
  "invoicePublicToken": "a1b2c3…",
  "sms": { "sent": true, "messageId": "SMxxxx", "reason": null },
  "email": { "sent": false, "messageId": null, "reason": null }
}
```

| Scenario                       | `sms`                                     | `email`                                          |
| ------------------------------ | ----------------------------------------- | ------------------------------------------------ |
| SMS sent (no email)            | `{ sent: true, messageId, reason: null }` | `{ sent: false, messageId: null, reason: null }` |
| No phone → email sent          | `{ sent: false, reason: "no_phone" }`     | `{ sent: true, messageId, reason: null }`        |
| SMS error → email sent         | `{ sent: false, reason: "error" }`        | `{ sent: true, messageId, reason: null }`        |
| No contact                     | `{ sent: false, reason: "no_phone" }`     | `{ sent: false, reason: "no_email" }`            |
| Already completed (idempotent) | `{ sent: false, reason: "duplicate" }`    | `{ sent: false, reason: null }`                  |

`sms.reason` ∈ `no_phone | invalid_number | duplicate | not_configured | error`  
`email.reason` ∈ `no_email | duplicate | not_configured | error` (or `null` when not attempted)

### Mobile handling (implemented)

| Response                                           | App behavior                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `200` + `success: true`                            | Patch `jobStatus` (+ `bookingStatus` when present) in home/details cache; invalidate queries; success haptic |
| `sms.sent` or `email.sent` on `job_completed`      | SMS or email success toast: "Customer notified with invoice and review link"                                 |
| Both false on `job_completed`                      | "Visit marked complete" + soft info why customer wasn't reached                                              |
| `sms.reason === "duplicate"` (idempotent complete) | "Visit marked complete" only — no nag toast                                                                  |
| `409` (non-complete actions)                       | Refetch booking; **no error toast** when already applied                                                     |
| `429`                                              | Honor `Retry-After`; debounce buttons                                                                        |

### Error responses

```json
{ "success": false, "error": "<English message>" }
```

| HTTP  | App handling                             |
| ----- | ---------------------------------------- |
| `400` | Error toast                              |
| `401` | "Sign in again…"                         |
| `404` | "Appointment not found."                 |
| `409` | Refetch; no error toast for already-done |
| `429` | Disable + retry after `Retry-After`      |
| `500` | Error toast; allow retry                 |

Failed **SMS send** is **not** an HTTP error — it returns `200` with `sms.sent = false`.

---

## Mobile implementation map

| Concern                                                 | Location                                                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| HTTP client + `sms` / `email` / `bookingStatus` parsing | `api/postBookingAction.js`                                                                               |
| SMS/email outcome parsers                               | `utils/parseBookingSmsOutcome.js`, `utils/parseBookingEmailOutcome.js`                                   |
| Action toasts                                           | `utils/bookingActionFeedback.js`                                                                         |
| On my way + start job                                   | `hooks/useBookingAction.js`                                                                              |
| Mark complete (Complete sheet + `job_completed`)        | [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md) · `useMarkBookingCompleteFlow.js` |
| Next Up card actions                                    | `home/components/NextUpCard.jsx`                                                                         |
| Mark complete from details                              | `screens/BookingDetailsScreen.jsx`                                                                       |
| Confirm sheet copy (SMS / email / no review)            | `booking-details/constants/bookingCompleteCopy.js`                                                       |
| Job status constants                                    | `constants/jobStatus.js`                                                                                 |
| Cache patches                                           | `utils/patchBookingJobStatusInHomeCache.js`, `utils/patchBookingJobStatusInDetailsCache.js`              |
| Feature flag (`job_completed` vs legacy)                | `booking-details/constants/markCompleteFeatureFlags.js`                                                  |

### Wired actions

| Action          | Entry                             | Hook / flow                                        |
| --------------- | --------------------------------- | -------------------------------------------------- |
| `on_the_way`    | Next Up → On my way               | `useBookingAction.notifyOnTheWay`                  |
| `job_started`   | Next Up → Slide to start          | `useBookingAction.startJob`                        |
| `job_completed` | Next Up / Details → Mark complete | `useMarkBookingCompleteFlow` → `postBookingAction` |

### Legacy path (off in production)

When `MARK_COMPLETE_USE_JOB_COMPLETED_ACTION = false`, mark complete uses Supabase `status = completed` + `POST …/review-invite`. **Do not use** alongside the actions endpoint for the same booking.

---

## Related docs

- [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md) — **mobile contract** for Complete sheet + `job_completed`
- [`MOBILE_BOOKING_WORK_FINISHED.md`](./MOBILE_BOOKING_WORK_FINISHED.md) — mobile contract for Done/Skip
- [`BOOKING_JOB_LIFECYCLE_SERVER.md`](./BOOKING_JOB_LIFECYCLE_SERVER.md) — **full lifecycle server contract** (work handoff, Complete screen, extended `job_completed`)
- [`MOBILE_BOOKING_ACTIONS.md`](./MOBILE_BOOKING_ACTIONS.md) — quick reference
- [`BOOKING_JOB_STARTED_SERVER.md`](./BOOKING_JOB_STARTED_SERVER.md) — server notes for `job_started`
- [`BOOKING_JOB_COMPLETED_SERVER.md`](./BOOKING_JOB_COMPLETED_SERVER.md) — server notes for `job_completed`

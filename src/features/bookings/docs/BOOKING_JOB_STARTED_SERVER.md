# Booking action: `job_started` (server)

When an owner **slides “Start job”** on **Home → Next Up**, mobile calls the booking-actions endpoint. **Mobile is wired** — see [`MOBILE_BOOKING_ACTIONS.md`](./MOBILE_BOOKING_ACTIONS.md) for client behavior, curl, and toasts.

**Scope:** `job_started` only. For **`job_completed`**, see [`MOBILE_SMS_AND_BOOKING_ACTIONS.md`](./MOBILE_SMS_AND_BOOKING_ACTIONS.md) and [`BOOKING_JOB_COMPLETED_SERVER.md`](./BOOKING_JOB_COMPLETED_SERVER.md).

---

## Mobile trigger

| UI                 | When                                   | Client call                                         |
| ------------------ | -------------------------------------- | --------------------------------------------------- |
| Slide to start job | `bookings.job_status === 'on_the_way'` | `POST …/actions` with `{ "action": "job_started" }` |

Implementation:

| Concern                                                                | Location                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------- |
| HTTP client + response parsing                                         | `src/features/bookings/api/postBookingAction.js`  |
| Mutation, cache patch, toasts (on-the-way today; start-job toasts TBD) | `src/features/bookings/hooks/useBookingAction.js` |
| Next Up card slide control                                             | `src/components/ui/SlideToStartJob.jsx`           |
| Wires slide → action                                                   | `src/features/home/components/NextUpCard.jsx`     |
| Action / status constants                                              | `src/features/bookings/constants/jobStatus.js`    |

---

## Endpoint (identical to `on_the_way`)

| Item     | Value                                                               |
| -------- | ------------------------------------------------------------------- |
| Method   | `POST`                                                              |
| Path     | `/api/availability/bookings/{bookingId}/actions`                    |
| Full URL | `{webAppOrigin}/api/availability/bookings/{bookingId}/actions`      |
| Origin   | `EXPO_PUBLIC_WEB_APP_URL` via `resolveStripeMobileCheckoutOrigin()` |

### Headers

| Header          | Required | Notes                                                          |
| --------------- | -------- | -------------------------------------------------------------- |
| `Authorization` | Yes      | `Bearer <supabase_session.access_token>`                       |
| `Content-Type`  | Yes      | `application/json`                                             |
| `Accept`        | Yes      | `application/json`                                             |
| `X-Request-ID`  | Optional | UUID; mobile sends one — echo in logs / response when possible |

### Request body

```json
{
  "action": "job_started"
}
```

Allowed `action` values on this route (mobile enum): `on_the_way` | `job_started` | `job_completed` (only **`job_started`** is in scope for this doc).

---

## State machine

**Server-owned column:** `bookings.job_status`

| Value         | Meaning                                              |
| ------------- | ---------------------------------------------------- |
| `not_started` | Default; owner has not tapped On my way              |
| `on_the_way`  | Owner notified customer they’re en route             |
| `in_progress` | Owner started the job on site                        |
| `completed`   | Job finished (future / separate complete flow today) |

### Transition for this action

```
on_the_way  --(job_started)-->  in_progress
```

| Rule                    | Detail                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| Required current status | `job_status = on_the_way`                                                        |
| Required booking status | `status = confirmed` (do **not** set `completed` here)                           |
| On success              | `job_status = in_progress`                                                       |
| Ownership               | Booking must belong to the authenticated owner’s business (same as `on_the_way`) |

### Idempotency / conflicts

| Case                               | Suggested behavior                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Already `in_progress`              | **200** with current state **or** **409** with a clear message (mobile treats 409 “already applied” as refresh-only, no error toast) |
| Still `not_started`                | **409** — must send on-the-way first                                                                                                 |
| Booking `completed` / `cancelled`  | **409**                                                                                                                              |
| Booking not found / wrong business | **404**                                                                                                                              |

---

## Database updates

### Required (minimum)

On successful `job_started`:

```sql
UPDATE bookings
SET job_status = 'in_progress'
    -- , updated_at = now()  -- if column exists
WHERE id = :bookingId
  AND business_id = :ownerBusinessId
  AND status = 'confirmed';
```

**Do not change** for this action:

- `bookings.status` — remains `confirmed`
- Payment / invoice fields — later

### Reads must include `job_status`

Mobile selects `job_status` on home spotlight and booking details. Any list/detail query used after the action must return the updated value (mobile also optimistically patches cache from the response, then invalidates queries).

Example select fragment (already used client-side):

```
id, scheduled_date, start_time, status, job_status, service_name, customer_name, …
```

---

## SMS (same pipeline as `on_the_way`)

Mirror the existing **On my way** implementation:

1. Load booking + business context.
2. If `customer_phone` is valid, send via existing Twilio (or provider) integration.
3. Log a row in **`sms_messages`** (recommended new `type`: **`job_started`**, parallel to existing **`on_the_way`**).
4. **Persist `job_status = in_progress` even if SMS fails** — return `sms.sent: false` with a `reason`.

Suggested message copy (TBD on server / product):

> Your service with {businessName} is starting now.

### SMS skip reasons (mobile already maps these for on-the-way)

Return one of these in `sms.reason` when `sent: false`:

| `reason`         | When                                                   |
| ---------------- | ------------------------------------------------------ |
| `no_phone`       | Missing customer phone on booking                      |
| `invalid_number` | Phone present but not sendable                         |
| `duplicate`      | Already sent for this booking + action (if you dedupe) |
| `not_configured` | SMS not set up for business                            |
| `error`          | Provider / internal failure                            |

---

## Success response

Mobile treats the call as success when **`HTTP 200`** (or 2xx) **and** `success === true`.

**Shape — same as `on_the_way`:**

```json
{
  "success": true,
  "action": "job_started",
  "jobStatus": "in_progress",
  "sms": {
    "sent": true,
    "messageId": "uuid-or-provider-id",
    "reason": null
  }
}
```

### Field notes

| Field       | Accepted keys                       | Notes                                                                                            |
| ----------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| Job status  | `jobStatus` **or** `job_status`     | Mobile reads either; prefer **`jobStatus`** for consistency with existing `on_the_way` responses |
| Action echo | `action`                            | Should be `"job_started"`                                                                        |
| SMS sent    | `sms.sent === true`                 | Boolean                                                                                          |
| SMS id      | `sms.messageId` or `sms.message_id` | Optional string                                                                                  |
| SMS skip    | `sms.reason`                        | String when `sent: false`                                                                        |

### Example: state updated, SMS skipped

```json
{
  "success": true,
  "action": "job_started",
  "jobStatus": "in_progress",
  "sms": {
    "sent": false,
    "messageId": null,
    "reason": "no_phone"
  }
}
```

### Reference: working `on_the_way` response

```json
{
  "success": true,
  "action": "on_the_way",
  "jobStatus": "on_the_way",
  "sms": {
    "sent": true,
    "messageId": "sms-uuid-1"
  }
}
```

---

## Error responses

Same contract as other booking-action routes.

| HTTP    | When                                                             | Body                                                                                          |
| ------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **400** | Missing / invalid `action`                                       | `{ "error": "…" }`                                                                            |
| **401** | Missing or invalid JWT                                           | `{ "error": "…" }`                                                                            |
| **404** | Booking not found or not in owner scope                          | `{ "error": "…" }`                                                                            |
| **409** | Invalid transition (e.g. still `not_started`, already completed) | `{ "error": "…" }` — message may include “already”, “not available for”, “invalid transition” |
| **429** | Rate limit                                                       | `{ "error": "…" }` + **`Retry-After`** header (seconds)                                       |
| **500** | Server error                                                     | `{ "error": "…" }`                                                                            |

Mobile maps these in `mapBookingActionHttpError` (`postBookingAction.js`).

---

## Mobile behavior after success

Documented in [`MOBILE_BOOKING_ACTIONS.md`](./MOBILE_BOOKING_ACTIONS.md). Summary:

1. Patches React Query cache with returned `jobStatus`.
2. Invalidates booking/home queries.
3. Success haptic + SMS or soft info toast.
4. Next Up card → **In progress** + **Mark complete**.

---

## Server implementation checklist

- [ ] Extend `POST /api/availability/bookings/:id/actions` handler: `case 'job_started':`
- [ ] Validate transition `on_the_way → in_progress` (and booking `status = confirmed`)
- [ ] Update `bookings.job_status = 'in_progress'`
- [ ] Send customer SMS + log `sms_messages` with `type = job_started` (best-effort; do not roll back status on SMS failure)
- [ ] Return JSON matching the **`on_the_way`** success shape
- [ ] Ensure all booking fetch paths expose `job_status`
- [ ] Tests: happy path, wrong state (`not_started`), no phone, duplicate/idempotent, 404, 409

---

## Out of scope (this doc)

| Item                                    | Notes                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `job_completed` via actions API         | **Shipped** — [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md) |
| Complete sheet + invoice SMS            | **Shipped** — Phase 1                                                                |
| Changing `bookings.status` on start job | Stay `confirmed` until mark complete                                                 |

---

## Related docs

- Mobile job status constants: `src/features/bookings/constants/jobStatus.js`
- Next Up card + wiring: `src/features/home/README.md`
- Mark complete: [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md)
- Doc index: [`README.md`](./README.md)

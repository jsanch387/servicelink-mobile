# Booking actions — mobile quick reference

All owner job lifecycle actions use **one endpoint**. **Full server contract (work handoff + Complete screen):** **[`BOOKING_JOB_LIFECYCLE_SERVER.md`](./BOOKING_JOB_LIFECYCLE_SERVER.md)**. SMS history and shared response shapes: **[`MOBILE_SMS_AND_BOOKING_ACTIONS.md`](./MOBILE_SMS_AND_BOOKING_ACTIONS.md)**.

```
POST {EXPO_PUBLIC_WEB_APP_URL}/api/availability/bookings/{bookingId}/actions
Authorization: Bearer <access_token>
{ "action": "on_the_way" | "job_started" | "work_finished" | "job_completed", ... }
```

## Wired in the app

| Action          | UI entry                                          | Code                                               |
| --------------- | ------------------------------------------------- | -------------------------------------------------- |
| `on_the_way`    | Next Up → **On my way**                           | `useBookingAction.notifyOnTheWay`                  |
| `job_started`   | Next Up → **Slide to start job**                  | `useBookingAction.startJob`                        |
| `work_finished` | Next Up → **Done** / **Skip**                     | `useBookingAction.workFinished(bookingId, notify)` |
| `job_completed` | Next Up → **Mark complete** → **Complete** screen | `useMarkBookingCompleteFlow` → `postBookingAction` |

## Module map (`work_finished`)

| Concern                           | Location                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Action constant + handoff helpers | `constants/jobStatus.js` (`WORK_FINISHED`, `isWorkHandoffDone`)                                               |
| HTTP client                       | `api/postBookingAction.js` — body `{ action, notify }`                                                        |
| Hook + cache patch                | `hooks/useBookingAction.js` → `patchBookingJobStatusInHomeCache.js`, `patchBookingJobStatusInDetailsCache.js` |
| Next Up UI                        | `home/components/NextUpCard.jsx`, `home/utils/resolveNextUpCardActions.js`                                    |
| Toasts                            | `utils/bookingActionFeedback.js`                                                                              |
| Booking selects                   | `api/bookings.js`, `booking-details/api/bookingDetails.js` — include `work_handoff_status`                    |

## On success (`200`, `success: true`)

- Patch cache with returned **`jobStatus`** and **`workHandoffStatus`** (when present).
- On `job_completed`, also patch **`bookingStatus`**.
- Invalidate home + booking details queries.
- Show channel-appropriate toast (`sms` / `email` / soft skip) — except **Skip** on `work_finished` (silent).

**Important:** UI advances on HTTP success even when SMS fails. Failed SMS alone is never a non-2xx response from the server.

## `work_finished` behavior

| Tap      | Request                                      | `work_handoff_status` after | SMS          | UI after success                           |
| -------- | -------------------------------------------- | --------------------------- | ------------ | ------------------------------------------ |
| **Done** | `{ action: "work_finished", notify: true }`  | `notified`                  | Attempt send | **Mark complete** (handoff buttons hidden) |
| **Skip** | `{ action: "work_finished", notify: false }` | `skipped`                   | None         | Same                                       |

- **Done** disabled when booking has no sendable phone; **Skip** always available.
- **Skip** shows **no toast** (owner keeps moving).
- **Done** toasts:

| Server                           | Owner sees                                                       |
| -------------------------------- | ---------------------------------------------------------------- |
| `sms.sent: true`                 | SMS toast — Customer notified your service is finished           |
| `sms.sent: false` + `sms.reason` | Info toast with reason (e.g. invalid number) — UI still advances |
| `sms.sent: false`, no reason     | Info toast — Marked done — couldn’t text customer                |
| `sms.reason: "duplicate"`        | No toast (idempotent re-tap)                                     |

## Other action toasts

### `on_the_way`

| Server            | Owner sees                                 |
| ----------------- | ------------------------------------------ |
| `sms.sent: true`  | SMS success toast                          |
| `sms.sent: false` | “Marked on the way” + info why SMS skipped |

### `job_started`

| Server            | Owner sees                                     |
| ----------------- | ---------------------------------------------- |
| `sms.sent: true`  | SMS success toast                              |
| `sms.sent: false` | Info — Marked started — couldn’t text customer |

### `job_completed`

| Server                            | Owner sees                                        |
| --------------------------------- | ------------------------------------------------- |
| `sms.sent: true`                  | SMS toast — Customer notified the service is done |
| `email.sent: true` (SMS not sent) | Email toast — same message                        |
| Both false                        | Visit marked complete + info why                  |
| `sms.reason: "duplicate"`         | Visit marked complete only (idempotent)           |

## Errors

| Status | Mobile                                                                          |
| ------ | ------------------------------------------------------------------------------- |
| `409`  | Refetch; no error toast if already applied                                      |
| `429`  | Debounce per `Retry-After`                                                      |
| Other  | Error toast — Couldn’t update the appointment. Try again. (or mapped HTTP copy) |

Client: `api/postBookingAction.js` · Hook: `hooks/useBookingAction.js` · Toasts: `utils/bookingActionFeedback.js`

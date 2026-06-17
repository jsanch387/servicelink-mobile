# Booking actions — mobile quick reference

All owner job lifecycle actions use **one endpoint**. Full contract (SMS history, state machine, response shapes): **[`MOBILE_SMS_AND_BOOKING_ACTIONS.md`](./MOBILE_SMS_AND_BOOKING_ACTIONS.md)**.

```
POST {EXPO_PUBLIC_WEB_APP_URL}/api/availability/bookings/{bookingId}/actions
Authorization: Bearer <access_token>
{ "action": "on_the_way" | "job_started" | "job_completed" }
```

## Wired in the app

| Action          | UI entry                              | Code                                               |
| --------------- | ------------------------------------- | -------------------------------------------------- |
| `on_the_way`    | Next Up → **On my way**               | `useBookingAction.notifyOnTheWay`                  |
| `job_started`   | Next Up → **Slide to start job**      | `useBookingAction.startJob`                        |
| `job_completed` | Next Up / Details → **Mark complete** | `useMarkBookingCompleteFlow` → `postBookingAction` |

## On success (`200`, `success: true`)

- Patch cache with returned **`jobStatus`** (and **`bookingStatus`** on `job_completed`).
- Invalidate home + booking details queries.
- Show channel-appropriate toast (`sms` / `email` / soft skip).

## `job_completed` toasts

| Server                            | Owner sees                                        |
| --------------------------------- | ------------------------------------------------- |
| `sms.sent: true`                  | SMS toast — Customer notified the service is done |
| `email.sent: true` (SMS not sent) | Email toast — same message                        |
| Both false                        | Visit marked complete + info why                  |
| `sms.reason: "duplicate"`         | Visit marked complete only (idempotent)           |

## Errors

| Status | Mobile                                     |
| ------ | ------------------------------------------ |
| `409`  | Refetch; no error toast if already applied |
| `429`  | Debounce per `Retry-After`                 |
| Other  | Error toast                                |

Client: `api/postBookingAction.js` · Toasts: `utils/bookingActionFeedback.js`

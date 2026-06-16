# Booking actions — mobile integration

Owner booking lifecycle actions share one endpoint. Mobile is **wired** for **`on_the_way`** and **`job_started`**.

| Action        | Mobile entry                     | Hook                              |
| ------------- | -------------------------------- | --------------------------------- |
| `on_the_way`  | Next Up → **On my way**          | `useBookingAction.notifyOnTheWay` |
| `job_started` | Next Up → **Slide to start job** | `useBookingAction.startJob`       |

---

## Endpoint

```
POST {EXPO_PUBLIC_WEB_APP_URL}/api/availability/bookings/{bookingId}/actions
```

`{bookingId}` = `bookings.id` UUID.

### Headers

```
Authorization: Bearer <Supabase session access_token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>   (optional; mobile sends one)
```

### Body

```json
{ "action": "job_started" }
```

---

## Job started — happy path

### curl

```bash
curl -sS -X POST "$API_BASE/api/availability/bookings/$BOOKING_ID/actions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"job_started"}'
```

### 200 OK

```json
{
  "success": true,
  "action": "job_started",
  "jobStatus": "in_progress",
  "sms": { "sent": true, "messageId": "<id>" }
}
```

### Mobile handling (implemented)

- Patch cache + invalidate queries with returned **`jobStatus`** (`in_progress`).
- Card switches to **In progress** + **Mark complete** (`resolveNextUpCardActionMode`).
- **`sms.sent === true`** → SMS toast: “Customer notified the service is starting”.
- **`sms.sent === false`** → info toast: “Marked started — couldn’t text customer” (not an error; state still changed).
- **`sms.reason`** when not sent: `no_phone` | `invalid_number` | `duplicate` | `not_configured` | `error`.

---

## Errors — `{ "success": false, "error": "<message>" }`

| Status  | Meaning                                                              | Mobile handling                                                            |
| ------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **400** | Missing bookingId or bad/missing action                              | Error toast                                                                |
| **401** | Missing/invalid token                                                | “Sign in again…”                                                           |
| **404** | Booking not found / not owned                                        | “Appointment not found”                                                    |
| **409** | Not confirmed, already `in_progress`/`completed`, invalid transition | Refetch booking, **no error toast** when message indicates already applied |
| **429** | Rate limited (`Retry-After` header)                                  | Debounce UI until window passes                                            |
| **500** | Unexpected                                                           | Error toast; allow retry                                                   |

---

## Debounce / visibility (mobile)

- **`startJob`** / **`notifyOnTheWay`** no-op while a mutation is pending, rate-limited, or the step is already done (`isJobStartedDone` / `isOnTheWayDone`).
- Slide control disabled while `bookingAction.disabled` (pending or cooldown).
- UI driven by **`job_status`**: slide appears only when `on_the_way`; hidden once `in_progress` or `completed`.

---

## Code map

| File                                | Role                                                         |
| ----------------------------------- | ------------------------------------------------------------ |
| `api/postBookingAction.js`          | HTTP client + response parsing                               |
| `hooks/useBookingAction.js`         | Mutation, cache patch, toasts, `startJob` / `notifyOnTheWay` |
| `home/components/NextUpCard.jsx`    | Slide → `startJob`                                           |
| `components/ui/SlideToStartJob.jsx` | Slide-to-confirm UI                                          |

---

## Server spec (full)

See [`BOOKING_JOB_STARTED_SERVER.md`](./BOOKING_JOB_STARTED_SERVER.md) for DB, SMS logging, state machine, and checklist.

# Contract: Mobile — `work_finished` (Done / Skip)

Owner marks field work finished on **Home → Next Up** before **Mark complete**. Sets `work_handoff_status` so `job_completed` can run.

**Next step:** [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md)

**Related:** [`MOBILE_BOOKING_ACTIONS.md`](./MOBILE_BOOKING_ACTIONS.md)

---

## Endpoint

|            |                                                  |
| ---------- | ------------------------------------------------ |
| **Method** | `POST`                                           |
| **Path**   | `/api/availability/bookings/{bookingId}/actions` |
| **Auth**   | `Authorization: Bearer <Supabase access_token>`  |

### Request body

**Done (notify customer):**

```json
{ "action": "work_finished", "notify": true }
```

**Skip (silent):**

```json
{ "action": "work_finished", "notify": false }
```

### Preconditions

| Check                      | Required                |
| -------------------------- | ----------------------- |
| `bookings.job_status`      | `in_progress`           |
| **Done** (`notify: true`)  | Sendable customer phone |
| **Skip** (`notify: false`) | Always allowed          |

### Success (200)

```json
{
  "success": true,
  "action": "work_finished",
  "jobStatus": "in_progress",
  "workHandoffStatus": "notified",
  "sms": { "sent": true, "messageId": "<uuid>", "reason": null }
}
```

| Tap      | `workHandoffStatus` after | SMS          |
| -------- | ------------------------- | ------------ |
| **Done** | `notified`                | Attempt send |
| **Skip** | `skipped`                 | None         |

`job_status` stays `in_progress`. UI shows **Mark complete** (handoff buttons hidden).

---

## Mobile integration (shipped)

| Concern        | Location                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------- |
| Done / Skip UI | `home/components/NextUpCard.jsx`                                                         |
| Action hook    | `bookings/hooks/useBookingAction.js` → `workFinished(bookingId, notify)`                 |
| HTTP client    | `bookings/api/postBookingAction.js`                                                      |
| Next Up gating | `home/utils/resolveNextUpCardActions.js`, `constants/jobStatus.js` (`isWorkHandoffDone`) |
| Cache patch    | `patchBookingJobStatusInHomeCache.js`, `patchBookingJobStatusInDetailsCache.js`          |
| Toasts         | `bookings/utils/bookingActionFeedback.js` — **Skip is silent**                           |

Include `work_handoff_status` in booking SELECTs (`api/bookings.js`, `booking-details/api/bookingDetails.js`).

---

## curl

```bash
curl -sS -X POST "$ORIGIN/api/availability/bookings/$BOOKING_ID/actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"work_finished","notify":true}'
```

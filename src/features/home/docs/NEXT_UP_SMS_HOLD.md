# Next Up — temporary SMS hold (remove when SMS ships)

**Status:** temporary ship mode  
**Remove this file** when `NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS` is permanently `true` and the hold is no longer needed.

Server-backed customer SMS (Twilio / carrier approval, Pingram, etc.) is **not ready**. We still want to ship Tap to Pay and Complete. Home’s Next Up card is intentionally simplified until SMS is live.

---

## What owners see today

| Control       | Behavior                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| **On my way** | Opens the **device Messages app** with a prefilled body (`openSmsOnMyWay`). No server SMS call. |
| **Navigate**  | Opens maps (`openMapsForBooking`). Unchanged.                                                   |

Section title stays **Next Up** (never **In progress** from lifecycle mode).

---

## What is built but hidden

All of this code remains in the repo. It is **not deleted** — only gated.

| UI / flow                          | Where it lives                                                 | Why hidden                                                                      |
| ---------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Slide to **Start job**             | `NextUpCard` + `useBookingAction.startJob`                     | Needs server `job_started` SMS                                                  |
| **Done** / **Skip** (work handoff) | `NextUpCard` + `workFinished`                                  | Needs server `work_finished` SMS                                                |
| **Mark complete** on Home          | `NextUpCard` + `useMarkBookingCompleteFlow`                    | Tied to full lifecycle; Complete still exists on booking details / when enabled |
| Live “in progress” pulse / title   | `resolveNextUpCardActionMode`, `resolveNextUpSectionTitle`     | Driven by `job_status` lifecycle                                                |
| Server **On my way** action        | `bookingAction.notifyOnTheWay` → `POST …/actions` `on_the_way` | Needs server SMS; replaced by device Messages                                   |

Lifecycle resolution helpers and tests stay under:

- `utils/resolveNextUpCardActions.js`
- `hooks/useNextUpLifecycleDesignPreview.js` (dev preview only)
- `components/NextUpCard.jsx` (full CTA branches still present)
- `bookings/hooks/useBookingAction.js`

---

## The switch

```js
// src/features/home/constants/nextUpDesignFlags.js
export const NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS = false; // ← ship mode
// set to true when server SMS is approved and wired
```

| Flag value | Next Up behavior                                    |
| ---------- | --------------------------------------------------- |
| `false`    | Device SMS **On my way** + **Navigate** only        |
| `true`     | Full job lifecycle CTAs + server-backed SMS actions |

Also gated in `HomeScreen.jsx`: section title, `onMarkComplete`, and work-finished handlers only pass through when the flag is `true`.

---

## What is still waiting (outside this flag)

These are **not** blocked by the Home flag alone; they need server / compliance work:

1. **SMS provider approval** and production send path (server holds the API key).
2. Booking actions endpoint sending SMS for `on_the_way`, `job_started`, `work_finished`, `job_completed` (see `bookings/docs/MOBILE_SMS_AND_BOOKING_ACTIONS.md`).
3. Golden rule already in the contract: **state first, SMS best-effort** — notification failure must not roll back job status.

**Can ship without SMS:** Tap to Pay, Complete sheet (fees / mark paid / `job_completed` persistence), device Messages “On my way”, Navigate.

**Needs SMS (or email fallback) for the full customer-notify experience:** progression texts and completion receipt/review text.

---

## Complete visit sheet (Mark complete modal)

Same SMS hold applies to the **Complete visit** full-screen sheet (booking details → Mark complete).

| UI                             | Ship mode (`COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY = false`) |
| ------------------------------ | -------------------------------------------------------------------- |
| Pre-complete follow-up row     | Hidden — no “We'll text your customer a receipt…”                    |
| Success detail after submit    | “This service is marked complete on your calendar.”                  |
| Pending overlay steps          | No “Sending receipt” / “Sending review link”                         |
| Legacy confirm sheet highlight | Hidden — simple calendar copy only                                   |

```js
// src/features/bookings/booking-details/constants/markCompleteFeatureFlags.js
export const COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY = false; // ← ship mode
```

Completion and payment collection still work; only customer-notification **promises** in UI are suppressed.

### Checkout without lifecycle CTAs (server change required)

Because Home lifecycle is off, owners open **Complete** while `job_status` may still be `not_started`. The server currently requires `in_progress` + work handoff before tap-to-pay / `job_completed` (**409** — “Mark work done before collecting payment”).

**Do not** auto-advance lifecycle from mobile before Tap to Pay — that triggers unintended customer SMS from `on_the_way` / `job_started`.

**Server fix:** relax lifecycle gates on `POST …/tap-to-pay/intent`, `connection-token`, and `job_completed` so Complete + payment work without Start Job / Done first. See `BOOKING_JOB_LIFECYCLE_SERVER.md` §6.1.

---

## Checklist when SMS is ready

1. Confirm server returns `sms` / `email` outcomes on booking actions (including `not_configured` → real sends).
2. Set `NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS = true`.
3. Set `COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY = true`.
4. Smoke-test Home: On my way (server toast), Start job, Done/Skip, Mark complete.
5. Smoke-test Complete sheet: follow-up copy + success detail mention receipt/review.
6. Delete **this file** and trim the “temporary ship mode” comments on the flags if nothing else references the hold.

---

## Related code (quick map)

| Piece                            | Path                                                                  |
| -------------------------------- | --------------------------------------------------------------------- |
| Home flag                        | `constants/nextUpDesignFlags.js`                                      |
| Complete visit flag              | `bookings/booking-details/constants/markCompleteFeatureFlags.js`      |
| Follow-up / success copy         | `bookings/booking-details/constants/completeVisitNotificationCopy.js` |
| Card CTAs                        | `components/NextUpCard.jsx`                                           |
| Home wiring                      | `screens/HomeScreen.jsx`                                              |
| Device Messages body / open      | `utils/appointmentOutbound.js` → `openSmsOnMyWay`                     |
| Server action hook (dormant)     | `bookings/hooks/useBookingAction.js`                                  |
| SMS contract                     | `bookings/docs/MOBILE_SMS_AND_BOOKING_ACTIONS.md`                     |
| Lifecycle tests (flag forced on) | `__tests__/NextUpCard.test.jsx`                                       |
| Ship-mode tests (flag off)       | `__tests__/NextUpCard.deviceOutbound.test.jsx`                        |

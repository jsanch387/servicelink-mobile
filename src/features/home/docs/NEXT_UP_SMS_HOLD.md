# Next Up — SMS hold (historical / rollback)

**Status:** Lifecycle + customer SMS UI are **on** for development (SMS approved).

| Flag                                             | Current |
| ------------------------------------------------ | ------- |
| `NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS`              | `true`  |
| `COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY` | `true`  |
| `CUSTOMER_SMS_TOASTS_ENABLED`                    | `true`  |

**Canonical Next Up behavior:** [`../README.md`](../README.md) (confirm sheets, spotlight lock, Navigate alert).

**Remove this file** when the hold is permanently retired and nothing else references it.

---

## What owners see (lifecycle on)

| Control             | Behavior                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| **On my way**       | Glass confirm → **Send** (`on_the_way` `notify: true`) or **Skip** → native alert → `notify: false` |
| **Navigate**        | Always tappable; empty address → **No address provided** alert                                      |
| **Slide to start**  | `job_started` (slide is the confirm)                                                                |
| **Skip** / **Done** | Glass confirms → `work_finished` (`notify: false` / `true`)                                         |
| **Mark complete**   | Complete sheet → `job_completed`                                                                    |

---

## Rollback (hold mode)

If server SMS must be paused again:

```js
// src/features/home/constants/nextUpDesignFlags.js
export const NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS = false;

// src/features/bookings/booking-details/constants/markCompleteFeatureFlags.js
export const COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY = false;

// src/features/sms/constants/customerSmsHold.js
export const CUSTOMER_SMS_TOASTS_ENABLED = false;
```

| Flag value | Next Up behavior                                    |
| ---------- | --------------------------------------------------- |
| `false`    | Device Messages **On my way** + **Navigate** only   |
| `true`     | Full job lifecycle CTAs + server-backed SMS actions |

With the lifecycle flag off, Home only shows device Messages **On my way** and **Navigate**. Section title stays **Next Up** (no lifecycle **In progress** from `job_status`).

### What stays in the repo when rolled back

| UI / flow                          | Where it lives                                                 |
| ---------------------------------- | -------------------------------------------------------------- |
| Slide to **Start job**             | `NextUpCard` + `useBookingAction.startJob`                     |
| **Done** / **Skip** (work handoff) | `NextUpCard` + confirm modals + `workFinished`                 |
| **Mark complete** on Home          | `NextUpCard` + `useMarkBookingCompleteFlow`                    |
| Server **On my way**               | `bookingAction.notifyOnTheWay` → `POST …/actions` `on_the_way` |

---

## Complete visit sheet (when notification copy is off)

| UI                          | Hold mode (`COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY = false`) |
| --------------------------- | -------------------------------------------------------------------- |
| Pre-complete follow-up row  | Hidden — no “We'll text your customer a receipt…”                    |
| Success detail after submit | “This service is marked complete on your calendar.”                  |
| Pending overlay steps       | No “Sending receipt” / “Sending review link”                         |

Completion and payment still work; only customer-notification **promises** in UI are suppressed.

### Checkout without lifecycle CTAs (server change)

If Home lifecycle is off, owners may open **Complete** while `job_status` is still `not_started`. The server may require `in_progress` + work handoff before tap-to-pay / `job_completed` (**409**).

**Do not** auto-advance lifecycle from mobile before Tap to Pay — that can trigger customer SMS. Prefer relaxing lifecycle gates on the server (see `BOOKING_JOB_LIFECYCLE_SERVER.md` §6.1).

---

## Checklist when re-enabling after a hold

1. Confirm server returns `sms` / `email` outcomes on booking actions.
2. Set the three flags above to `true`.
3. Smoke-test Home: On my way (confirm → Send/Skip), Start job, Done/Skip confirms, Mark complete, Navigate without address.
4. Smoke-test Complete sheet: follow-up copy + success detail.
5. Smoke-test create appointment: confirmation SMS toast when phone is present.
6. Delete **this file** when the hold is permanently retired.

---

## Related code (quick map)

| Piece                            | Path                                                                   |
| -------------------------------- | ---------------------------------------------------------------------- |
| Home flag                        | `constants/nextUpDesignFlags.js`                                       |
| Complete visit flag              | `bookings/booking-details/constants/markCompleteFeatureFlags.js`       |
| SMS toast flag                   | `sms/constants/customerSmsHold.js`                                     |
| Booking action toasts            | `bookings/utils/bookingActionFeedback.js`                              |
| Confirm sheets                   | `components/OnMyWayConfirmModal.jsx`, `SkipWorkNotifyConfirmModal.jsx` |
| Card CTAs                        | `components/NextUpCard.jsx`                                            |
| Device Messages / maps           | `utils/appointmentOutbound.js`                                         |
| SMS contract                     | `bookings/docs/MOBILE_SMS_AND_BOOKING_ACTIONS.md`                      |
| Lifecycle tests (flag forced on) | `__tests__/NextUpCard.test.jsx`                                        |
| Ship-mode tests (flag off)       | `__tests__/NextUpCard.deviceOutbound.test.jsx`                         |

# Bookings — lifecycle & Complete flow docs

Index for owner job lifecycle (Next Up → Complete sheet) and related server contracts.

## Mobile contracts (start here)

| Doc                                                                        | When to read                                     |
| -------------------------------------------------------------------------- | ------------------------------------------------ |
| [`MOBILE_BOOKING_ACTIONS.md`](./MOBILE_BOOKING_ACTIONS.md)                 | Quick reference — all actions, toasts, errors    |
| [`MOBILE_BOOKING_WORK_FINISHED.md`](./MOBILE_BOOKING_WORK_FINISHED.md)     | Done / Skip (`work_finished`)                    |
| [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md)     | Complete sheet + `job_completed` payload         |
| [`MOBILE_BOOKING_TAP_TO_PAY.md`](./MOBILE_BOOKING_TAP_TO_PAY.md)           | Tap to Pay — intent, Terminal SDK, iOS v1        |
| [`TAP_TO_PAY_TERMINAL_SERVER.md`](./TAP_TO_PAY_TERMINAL_SERVER.md)         | Terminal Location server reference (implemented) |
| [`MOBILE_SMS_AND_BOOKING_ACTIONS.md`](./MOBILE_SMS_AND_BOOKING_ACTIONS.md) | SMS/email response shapes                        |

## Server contracts

| Doc                                                                        | Audience                               |
| -------------------------------------------------------------------------- | -------------------------------------- |
| [`BOOKING_JOB_LIFECYCLE_SERVER.md`](./BOOKING_JOB_LIFECYCLE_SERVER.md)     | Master lifecycle state machine         |
| [`BOOKING_COMPLETE_PHASE1_SERVER.md`](./BOOKING_COMPLETE_PHASE1_SERVER.md) | Phase 1 persist + invoice + notify     |
| [`BOOKING_JOB_COMPLETED_SERVER.md`](./BOOKING_JOB_COMPLETED_SERVER.md)     | Pointer to mobile + Phase 1 server doc |
| [`BOOKING_JOB_STARTED_SERVER.md`](./BOOKING_JOB_STARTED_SERVER.md)         | `job_started` only                     |

## Legacy (flag off only)

| Doc                                                                                                        | Notes                                                                                                   |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`../booking-details/docs/BOOKING_COMPLETE_SERVER.md`](../booking-details/docs/BOOKING_COMPLETE_SERVER.md) | Supabase complete + `POST …/review-invite` — used when `MARK_COMPLETE_USE_JOB_COMPLETED_ACTION = false` |

## Database (Phase 1 Complete)

**Migration (applied):** [`docs/sql/booking_complete_phase1_migration.sql`](../../../docs/sql/booking_complete_phase1_migration.sql)

| Table / column                            | Written on `job_completed`                        |
| ----------------------------------------- | ------------------------------------------------- |
| `booking_session_fee_lines`               | Owner-added fees from `sessionFees[]`             |
| `booking_payments.session_*`              | In-person / session payment from `sessionPayment` |
| `booking_payments.remaining_amount_cents` | `0` when settled                                  |
| `bookings.status`, `bookings.job_status`  | `completed`                                       |
| `booking_invoices`                        | `public_token`, `snapshot_json`, totals           |

**Read for Complete sheet UI:** `bookings.service_price_cents`, `bookings.addon_details`, `booking_payments.paid_online_amount_cents` (via details fetch).

**Read for Next Up gating:** `bookings.job_status`, `bookings.work_handoff_status`.

See also [`DATABASE_SCHEMA_REFERENCE.md`](../../../DATABASE_SCHEMA_REFERENCE.md) for core `bookings` columns.

## HTTP calls (production path)

All lifecycle actions use one endpoint:

```
POST {EXPO_PUBLIC_WEB_APP_URL}/api/availability/bookings/{bookingId}/actions
Authorization: Bearer <access_token>
```

| Action                                       | Mobile module                                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `on_the_way`, `job_started`, `work_finished` | `hooks/useBookingAction.js` → `api/postBookingAction.js`                                                       |
| `job_completed`                              | `booking-details/hooks/useMarkBookingCompleteFlow.js` → `buildJobCompletedPayload.js` → `postBookingAction.js` |
| Tap to Pay intent                            | `tap-to-pay/api/postTapToPayIntent.js`, `postTapToPayConnectionToken.js`                                       |

**Do not call** (when feature flags on): Supabase `UPDATE bookings SET status = completed`, `POST …/review-invite`.

## Mobile code map

| Concern        | Path                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Next Up UI     | `home/components/NextUpCard.jsx`, `home/utils/resolveNextUpCardActions.js`                       |
| Complete sheet | `booking-details/components/BookingCompleteInvoiceDesignSheet.jsx` (`BookingCompleteVisitSheet`) |
| Payload        | `booking-details/utils/buildJobCompletedPayload.js`                                              |
| Confirm hook   | `booking-details/hooks/useMarkBookingCompleteFlow.js`                                            |
| Feature flags  | `booking-details/constants/markCompleteFeatureFlags.js`                                          |
| Tap to Pay     | `tap-to-pay/` — see [`MOBILE_BOOKING_TAP_TO_PAY.md`](./MOBILE_BOOKING_TAP_TO_PAY.md)             |
| Toasts         | `utils/bookingActionFeedback.js`                                                                 |

## Tests

```bash
npm test -- --testPathPattern="postBookingAction|buildJobCompletedPayload|useMarkBookingCompleteFlow|bookingActionFeedback|completeVisitNotificationCopy|NextUpCard|useBookingAction|markCompletePreview|buildCompleteVisitModel|parseCompleteVisitServiceLine|tap-to-pay"
```

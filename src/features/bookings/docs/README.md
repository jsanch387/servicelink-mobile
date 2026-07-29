# Bookings — lifecycle & Complete flow docs

Index for owner appointments (create → edit → details → Complete) and related server contracts.

## Start here (product + data model)

| Doc                                                                    | When to read                                                                                                      |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`MOBILE_APPOINTMENT_LIFECYCLE.md`](./MOBILE_APPOINTMENT_LIFECYCLE.md) | **Create / edit / details / complete / today’s earnings** — `job_details` vs `addon_details`, add-ons hub, totals |

## Create (owner manual booking)

| Doc                                                                                                                                          | When to read                         |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [`../create-appointment/docs/OWNER_MANUAL_BOOKING_MULTI_JOB_SERVER.md`](../create-appointment/docs/OWNER_MANUAL_BOOKING_MULTI_JOB_SERVER.md) | `jobs[]` create contract (length 1+) |
| [`../create-appointment/docs/OWNER_MANUAL_BOOKING_SERVER.md`](../create-appointment/docs/OWNER_MANUAL_BOOKING_SERVER.md)                     | Auth, location, shared create rules  |
| [`../create-appointment/docs/OWNER_MANUAL_BOOKING_SALE_DISCOUNT.md`](../create-appointment/docs/OWNER_MANUAL_BOOKING_SALE_DISCOUNT.md)       | Sale / discount on create            |
| [`../create-appointment/docs/WEB_MULTI_JOB_APPOINTMENT_CREATE.md`](../create-appointment/docs/WEB_MULTI_JOB_APPOINTMENT_CREATE.md)           | Web replication of create UX         |

## Mobile contracts (Complete / actions)

| Doc                                                                        | When to read                                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [`MOBILE_BOOKING_ACTIONS.md`](./MOBILE_BOOKING_ACTIONS.md)                 | Quick reference — all actions, toasts, errors                |
| [`MOBILE_BOOKING_WORK_FINISHED.md`](./MOBILE_BOOKING_WORK_FINISHED.md)     | Done / Skip (`work_finished`)                                |
| [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md)     | Complete sheet + `job_completed` payload                     |
| [`MOBILE_BOOKING_TAP_TO_PAY.md`](./MOBILE_BOOKING_TAP_TO_PAY.md)           | Tap to Pay — intent, Terminal SDK, iOS v1                    |
| [`TAP_TO_PAY_TERMINAL_SERVER.md`](./TAP_TO_PAY_TERMINAL_SERVER.md)         | Terminal Location server reference (implemented)             |
| [`TAP_TO_PAY_WARMUP_SERVER.md`](./TAP_TO_PAY_WARMUP_SERVER.md)             | **App warm-up** — merchant connection-token route (required) |
| [`MOBILE_SMS_AND_BOOKING_ACTIONS.md`](./MOBILE_SMS_AND_BOOKING_ACTIONS.md) | SMS/email response shapes                                    |

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

**Read for Complete sheet UI:** prefer `job_details` (services + add-ons); fall back to `addon_details` when job add-ons are empty. Also `booking_payments.paid_online_amount_cents`.

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

| Concern            | Path                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Lifecycle overview | [`MOBILE_APPOINTMENT_LIFECYCLE.md`](./MOBILE_APPOINTMENT_LIFECYCLE.md)                           |
| Next Up UI         | `home/components/NextUpCard.jsx`, `home/utils/resolveNextUpCardActions.js`                       |
| Today’s earnings   | `home/utils/todaysEarnings.js`, `home/components/TodaysPotentialCard.jsx`                        |
| Complete sheet     | `booking-details/components/BookingCompleteInvoiceDesignSheet.jsx` (`BookingCompleteVisitSheet`) |
| Payload            | `booking-details/utils/buildJobCompletedPayload.js`                                              |
| Confirm hook       | `booking-details/hooks/useMarkBookingCompleteFlow.js`                                            |
| Feature flags      | `booking-details/constants/markCompleteFeatureFlags.js`                                          |
| Tap to Pay         | `tap-to-pay/` — see [`MOBILE_BOOKING_TAP_TO_PAY.md`](./MOBILE_BOOKING_TAP_TO_PAY.md)             |
| Toasts             | `utils/bookingActionFeedback.js`                                                                 |

## Tests

```bash
npm test -- --testPathPattern="postBookingAction|buildJobCompletedPayload|useMarkBookingCompleteFlow|bookingActionFeedback|completeVisitNotificationCopy|NextUpCard|useBookingAction|markCompletePreview|buildCompleteVisitModel|parseCompleteVisitServiceLine|tap-to-pay|todaysEarnings|buildEditHubSections|buildEditBookingUpdatePayload"
```

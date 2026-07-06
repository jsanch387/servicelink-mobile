# Booking `job_completed` — server notes

**Mobile contract (source of truth for app integration):** [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md)

Mobile calls `POST …/bookings/{id}/actions` with `{ "action": "job_completed", ... }`. **Mobile is wired** when `MARK_COMPLETE_USE_JOB_COMPLETED_ACTION` is `true`.

## Primary handoff (server implementation)

**[`BOOKING_COMPLETE_PHASE1_SERVER.md`](./BOOKING_COMPLETE_PHASE1_SERVER.md)** — Full server agent context: DB writes, handler steps, SMS, public invoice page, curl tests.

**Schema reference:** [`docs/sql/booking_complete_phase1_migration.sql`](../../../docs/sql/booking_complete_phase1_migration.sql)

## Also read

| Doc                                                                        | Purpose                             |
| -------------------------------------------------------------------------- | ----------------------------------- |
| [`BOOKING_JOB_LIFECYCLE_SERVER.md`](./BOOKING_JOB_LIFECYCLE_SERVER.md) §6  | Master lifecycle contract           |
| [`MOBILE_SMS_AND_BOOKING_ACTIONS.md`](./MOBILE_SMS_AND_BOOKING_ACTIONS.md) | Shared actions endpoint, SMS shapes |

## Server must (summary)

1. Accept extended body: `sessionFees[]`, optional `sessionPayment`
2. Validate handoff done + amount due = 0
3. Persist fees, session payment, `job_status` / `status` = completed, `booking_invoices` row
4. Create review invite internally (no separate mobile `POST …/review-invite`)
5. Send **one** customer notification (SMS → email fallback) with invoice public link (`/i/{invoicePublicToken}`)
6. Return `bookingStatus`, `jobStatus`, `workHandoffStatus`, `invoicePublicToken`, `sms`, and `email` outcome blocks

## Mobile must not

- Call `POST …/review-invite` after `job_completed`
- Use legacy `completeBookingWithReviewInvite` when the feature flag is on

## Mobile code

| Piece                 | Path                                                               |
| --------------------- | ------------------------------------------------------------------ |
| Complete sheet UI     | `booking-details/components/BookingCompleteInvoiceDesignSheet.jsx` |
| Payload builder       | `booking-details/utils/buildJobCompletedPayload.js`                |
| Confirm + action call | `booking-details/hooks/useMarkBookingCompleteFlow.js`              |
| HTTP client           | `bookings/api/postBookingAction.js`                                |
| Toasts                | `bookings/utils/bookingActionFeedback.js`                          |

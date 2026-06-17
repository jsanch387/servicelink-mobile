# Booking `job_completed` — server notes

Mobile calls `POST …/bookings/{id}/actions` with `{ "action": "job_completed" }`. **Mobile is wired** when `MARK_COMPLETE_USE_JOB_COMPLETED_ACTION` is `true`.

**Full contract (request/response tables, SMS history, idempotency):** [`MOBILE_SMS_AND_BOOKING_ACTIONS.md`](./MOBILE_SMS_AND_BOOKING_ACTIONS.md) §4.

## Server must

1. Set `job_status = completed` **and** `status = completed`.
2. Run post-completion side effects (maintenance, etc.).
3. Send **one** customer notification: review SMS → email fallback, or plain thank-you if already reviewed.
4. Return `bookingStatus`, `jobStatus`, `sms`, and `email` outcome blocks.

## Mobile must not

- Call `POST …/review-invite` after `job_completed`.
- Use legacy `completeBookingWithReviewInvite` for the same booking when the feature flag is on.

## Mobile code

| Piece                       | Path                                                  |
| --------------------------- | ----------------------------------------------------- |
| Confirm sheet + action call | `booking-details/hooks/useMarkBookingCompleteFlow.js` |
| Response parsing            | `api/postBookingAction.js`                            |
| Toasts                      | `utils/bookingActionFeedback.js`                      |

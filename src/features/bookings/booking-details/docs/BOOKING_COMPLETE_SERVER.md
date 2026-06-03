# Owner mark complete + review invite email (mobile)

When an owner marks a booking **complete** from **Booking details** or **Home → Next Up**:

1. Mobile updates **`bookings.status = 'completed'`** in Supabase (owner RLS).
2. If eligible, mobile calls **`POST /api/availability/bookings/{bookingId}/review-invite`** to create the invite row and send email (Resend runs server-side only).

Mobile does **not** call a server route to mark the booking complete.

## Environment

| Variable                  | Purpose                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `EXPO_PUBLIC_WEB_APP_URL` | Origin for review-invite API (`resolveStripeMobileCheckoutOrigin()`) |

Same HTTPS guard as other mobile → Next clients (`productionWebApiHttpsGuard`).

## Auth (review-invite only)

`Authorization: Bearer <supabase_session.access_token>`

Optional: `X-Request-ID` for log correlation.

## Eligibility (Supabase reads, owner session)

Before the confirm sheet, mobile loads the same context as web `loadReviewInviteEligibilityContext`:

| Flag                                   | Rule                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Modal copy (`showReviewInviteMessage`) | `hasEmail && !customerAlreadyReviewed`                                                                             |
| Call review-invite after complete      | `willSendReviewInviteOnComplete` (valid email, `customer_id`, no review, no pending invite, no invite for booking) |

Tables: `reviews`, `review_invites`, booking row fields on `bookings`.

## Review invite API

**`POST /api/availability/bookings/:bookingId/review-invite`**

No body. Call **only after** Supabase status is `completed`.

**200** — `sent: true` (email sent), or `skipped: true` with `reason`, or invite created with `sent: false` (email failed, best-effort).

**400** — booking not completed yet. **401** / **404** — auth or booking scope.

Booking stays completed if the invite call fails (same as web).

## Mobile modules

| File                                          | Role                                                 |
| --------------------------------------------- | ---------------------------------------------------- |
| `reviews/utils/reviewInviteEligibility.js`    | `willSendReviewInviteOnComplete`, modal copy helpers |
| `reviews/api/loadReviewEligibilityContext.js` | Supabase eligibility sets                            |
| `api/bookingDetails.js`                       | `markBookingCompletedById` (Supabase update)         |
| `api/postReviewInviteForBooking.js`           | POST review-invite                                   |
| `api/completeBookingWithReviewInvite.js`      | Complete in Supabase, then optional invite           |
| `constants/bookingCompleteCopy.js`            | Sheet copy from `showReviewInviteMessage`            |
| `components/BookingMarkCompleteSheet.jsx`     | Confirm / Cancel bottom sheet                        |
| `hooks/useMarkBookingCompleteFlow.js`         | Eligibility load + confirm + cache invalidation      |

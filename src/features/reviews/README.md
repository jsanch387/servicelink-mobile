# Reviews feature

Owner reviews inbox, public booking-link reviews, and mark-complete → review-invite integration.

**Full reference:** [`docs/reviews-feature.md`](./docs/reviews-feature.md)

**Mark complete + invite API:** [`../bookings/booking-details/docs/BOOKING_COMPLETE_SERVER.md`](../bookings/booking-details/docs/BOOKING_COMPLETE_SERVER.md)

## Quick entry points

| Screen / flow             | Hook / module                                            |
| ------------------------- | -------------------------------------------------------- |
| Reviews inbox             | `screens/ReviewsScreen.jsx` → `useReviewsInbox`          |
| Post owner reply          | `useSubmitReviewReply` → `api/reviews.updateReviewReply` |
| Booking link reviews tab  | `useBookingLinkPublicReviews`                            |
| Complete booking + invite | `useMarkBookingCompleteFlow` (bookings feature)          |

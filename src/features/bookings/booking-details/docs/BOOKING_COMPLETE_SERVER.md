# Legacy: owner mark complete + review invite (mobile)

> **Production path (flags on):** [`MOBILE_BOOKING_JOB_COMPLETED.md`](../../docs/MOBILE_BOOKING_JOB_COMPLETED.md) — `POST …/actions` with `job_completed`. Server persists checkout, invoice, and customer SMS/email. Mobile does **not** call review-invite separately.
>
> This document describes the **fallback** when `MARK_COMPLETE_USE_JOB_COMPLETED_ACTION = false` in `constants/markCompleteFeatureFlags.js`.

---

When the legacy flag is off, marking complete from **Booking details** or **Home → Next Up** uses:

1. Mobile updates **`bookings.status = 'completed'`** in Supabase (owner RLS).
2. If eligible, mobile calls **`POST /api/availability/bookings/{bookingId}/review-invite`** to create the invite row and send email.

Mobile does **not** call a server route to mark the booking complete on this path.

## Environment

| Variable                  | Purpose                      |
| ------------------------- | ---------------------------- |
| `EXPO_PUBLIC_WEB_APP_URL` | Origin for review-invite API |

## Review invite API

**`POST /api/availability/bookings/:bookingId/review-invite`**

No body. Call **only after** Supabase status is `completed`.

## Eligibility (Supabase reads)

Before the confirm sheet, mobile loads `loadReviewEligibilityContext` — same rules as web.

| Flag                              | Rule                                        |
| --------------------------------- | ------------------------------------------- |
| Modal copy                        | Valid email + customer not already reviewed |
| Call review-invite after complete | `willSendReviewInviteOnComplete`            |

## Legacy mobile modules

| File                                      | Role                                        |
| ----------------------------------------- | ------------------------------------------- |
| `api/completeBookingWithReviewInvite.js`  | Supabase complete, then optional invite     |
| `api/postReviewInviteForBooking.js`       | POST review-invite                          |
| `api/bookingDetails.js`                   | `markBookingCompletedById`                  |
| `components/BookingMarkCompleteSheet.jsx` | Simple confirm sheet (no Complete checkout) |
| `hooks/useMarkBookingCompleteFlow.js`     | Branches to legacy when flag off            |

## UI when flags on (current production)

| Flag                                             | UI                                                         |
| ------------------------------------------------ | ---------------------------------------------------------- |
| `MARK_COMPLETE_USE_COMPLETE_VISIT_SCREEN = true` | `BookingCompleteVisitSheet` — fees, mark as paid, Complete |
| `MARK_COMPLETE_USE_JOB_COMPLETED_ACTION = true`  | `job_completed` action (not Supabase + review-invite)      |

# Reviews feature (mobile)

This document describes how reviews work in the ServiceLink mobile app: owner inbox, public booking-link display, mark-complete → review-invite flow, data sources, and caching.

For the **review-invite HTTP contract** (POST after booking complete), see also [`bookings/booking-details/docs/BOOKING_COMPLETE_SERVER.md`](../../bookings/booking-details/docs/BOOKING_COMPLETE_SERVER.md).

## Overview

Mobile covers three review-related areas:

| Area                       | Who                         | What mobile does                                                                    |
| -------------------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| **Reviews inbox**          | Signed-in owner             | List reviews, filter “Needs reply”, post public owner replies                       |
| **Booking link (public)**  | Owner previewing their link | Read visible reviews + summary; show header rating when count &gt; 0                |
| **Mark complete → invite** | Signed-in owner             | Complete booking in Supabase; optionally call web API to create invite + send email |

Mobile does **not**:

- Create `reviews` rows (customer submits via web `/review/{token}`)
- Insert into `review_invites` directly (server creates on `POST …/review-invite`)
- Send email (Resend runs on Next.js only)
- Hide/unhide reviews (no mobile UI for `is_hidden` yet; owner list still loads hidden rows)

## Configuration

| Variable                  | Role                                                                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_WEB_APP_URL` | Origin for review-invite API (`resolveStripeMobileCheckoutOrigin()`). Production builds require **https** (`productionWebApiHttpsGuard`). |

All Supabase reads/writes use the **owner session** JWT (RLS). Never send the service role key from mobile.

## Navigation

Defined in `src/routes/routes.js`:

| Constant         | Screen                             |
| ---------------- | ---------------------------------- |
| `ROUTES.REVIEWS` | Owner reviews inbox (`More` stack) |

Booking-link reviews are a **tab** inside `BookingLinkPreview` (`BOOKING_LINK_TAB_REVIEWS`), not a separate route.

## Database tables

### `reviews`

Primary table for inbox, public list, and eligibility checks.

**Columns mobile selects** (`REVIEW_OWNER_LIST_COLUMNS` in `api/reviews.js`):

| Column                | Use                                                             |
| --------------------- | --------------------------------------------------------------- |
| `id`                  | Row identity                                                    |
| `author_display_name` | Card header name                                                |
| `rating`              | 1–5 stars                                                       |
| `body`                | Customer review text                                            |
| `created_at`          | Sort + date label                                               |
| `owner_reply_body`    | Owner public reply                                              |
| `owner_replied_at`    | Reply timestamp                                                 |
| `is_hidden`           | Public query filters `is_hidden = false`; owner inbox loads all |

**Columns mobile updates** (owner reply only):

| Column             | Value                       |
| ------------------ | --------------------------- |
| `owner_reply_body` | Trimmed reply, 1–1000 chars |
| `owner_replied_at` | ISO timestamp at post time  |

Update is scoped with `.eq('id', reviewId).eq('business_id', businessId)`.

**Columns read for eligibility only** (not in list select):

| Column        | Query                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| `customer_id` | `reviews` where `business_id` + `customer_id IN (…)` → “already reviewed” |

### `review_invites`

Mobile **reads only** (eligibility before mark complete). Rows are created by the web API when an invite is sent.

| Query                                                     | Purpose                                          |
| --------------------------------------------------------- | ------------------------------------------------ |
| `status = 'pending'`, `business_id`, `customer_id IN (…)` | Block duplicate pending invite for same customer |
| `booking_id IN (…)`                                       | Block invite already tied to this booking        |

### `bookings`

Used in the mark-complete flow (bookings feature, not reviews inbox):

| Column           | Use                                                               |
| ---------------- | ----------------------------------------------------------------- |
| `id`             | Booking being completed                                           |
| `customer_id`    | Required for review-invite eligibility                            |
| `customer_email` | Modal copy + invite eligibility                                   |
| `status`         | Mobile sets `'completed'` via Supabase before optional invite API |

See `markBookingCompletedById` in `bookings/booking-details/api/bookingDetails.js`.

### `business_profiles`

Resolved via `fetchBusinessProfileForUser(userId)` → `business_profiles.id` used as `business_id` on all review queries.

## Data feeds

### 1. Supabase — owner inbox

**Module:** `src/features/reviews/api/reviews.js`

| Function                              | Table     | Filters       | Order                        |
| ------------------------------------- | --------- | ------------- | ---------------------------- |
| `fetchReviewsForBusiness(businessId)` | `reviews` | `business_id` | `created_at` desc, limit 100 |

**Hook:** `useReviewsInbox()` — loads business profile + review list, builds summary, refetches on screen focus.

### 2. Supabase — public booking link

**Module:** `src/features/reviews/api/reviews.js`

| Function                                    | Table     | Filters                            | Order                        |
| ------------------------------------------- | --------- | ---------------------------------- | ---------------------------- |
| `fetchPublicReviewsForBusiness(businessId)` | `reviews` | `business_id`, `is_hidden = false` | `created_at` desc, limit 100 |

**Hook:** `useBookingLinkPublicReviews(businessId, enabled)` in `bookingLink/hooks/`.

- **Header rating:** `averageRating` shown only when `summary.totalCount > 0` (`BookingLinkPreview.jsx`).
- **Reviews tab:** summary + flat list via `PublicReviewRow`; empty state when no visible reviews.

### 3. Supabase — owner reply (write)

**Module:** `src/features/reviews/api/reviews.js`

| Function                                             | Operation                                               |
| ---------------------------------------------------- | ------------------------------------------------------- |
| `updateReviewReply(businessId, reviewId, replyText)` | `UPDATE reviews SET owner_reply_body, owner_replied_at` |

**Hook:** `useSubmitReviewReply(businessId)` — optimistic cache patch on `reviewsListQueryKey(businessId)`.

Validation: `validateReviewReply` in `utils/reviewModel.js` (max length `REVIEW_REPLY_MAX_LENGTH` = 1000, matches web).

### 4. Supabase — review-invite eligibility (read)

**Module:** `src/features/reviews/api/loadReviewEligibilityContext.js`

Batch-loads three sets for one or more bookings:

- `reviewedCustomerIds` from `reviews`
- `pendingInviteCustomerIds` from `review_invites` (`status = 'pending'`)
- `bookingIdsWithInvite` from `review_invites` by `booking_id`

**Logic:** `utils/reviewInviteEligibility.js` (mirrors web dashboard).

| Decision                                       | Rule                                                                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Confirm sheet copy (`showReviewInviteMessage`) | `hasEmail && !customerAlreadyReviewed`                                                                                      |
| Call review-invite API after complete          | `willSendReviewInviteOnComplete` (valid email, `customer_id`, no existing review, no pending invite, no invite for booking) |

**Hook:** `useMarkBookingCompleteFlow` (bookings feature) loads context when the sheet opens, then `completeBookingWithReviewInvite` on confirm.

### 5. Web API — review invite email (write via server)

**Module:** `bookings/booking-details/api/postReviewInviteForBooking.js`

| Method | Path                                                   | When                                                                            |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `POST` | `/api/availability/bookings/{bookingId}/review-invite` | After Supabase `status = 'completed'`, only if `willSendReviewInviteOnComplete` |

Auth: `Authorization: Bearer <access_token>`. Optional `X-Request-ID`.

Orchestrator: `completeBookingWithReviewInvite.js` — completion is **not** rolled back if the invite call fails.

Full request/response shapes: [`BOOKING_COMPLETE_SERVER.md`](../../bookings/booking-details/docs/BOOKING_COMPLETE_SERVER.md).

## UI model

**Mapper:** `mapReviewRowToModel` in `utils/reviewModel.js`

```text
ReviewListItem {
  id, authorDisplayName, rating, body, createdAt, dateLabel,
  ownerReply: { body, repliedAt } | null,
  isHidden,
  replyStatus: 'needs_reply' | 'replied'
}
```

**Summary:** `buildReviewsSummary(reviews)` — client-side average, count, 5→1 star breakdown (%). Empty list uses `REVIEWS_EMPTY_SUMMARY` from `constants.js`.

**Inbox filters:** `filterReviews` — `all` (default) or `needs_reply` (`replyStatus === 'needs_reply'`).

## Caching (React Query)

| Key                                              | Module                     | Purpose                     |
| ------------------------------------------------ | -------------------------- | --------------------------- |
| `['reviews', 'list', businessId]`                | `reviews/queryKeys.js`     | Owner inbox list            |
| `['booking-link', 'public-reviews', businessId]` | `bookingLink/queryKeys.js` | Public booking-link reviews |
| `homeBusinessProfileQueryKey(userId)`            | `home/queryKeys.js`        | Business id for inbox       |

`useReviewsInbox` refetches `REVIEWS_QUERY_ROOT` on focus. Reply mutation patches list cache in place (no full invalidation required).

## Shared UI

| Component               | Used in                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `StarRating`            | Inbox cards, booking link rows/summary                                             |
| `ReviewBodyText`        | Inbox `ReviewCard`, booking link `PublicReviewRow` (body uses `colors.linkSubtle`) |
| `ReviewsSummarySection` | Inbox summary card, booking link reviews tab                                       |
| `ReviewCard`            | Owner inbox only (reply composer)                                                  |
| `PublicReviewRow`       | Booking link tab (read-only)                                                       |

**Star color:** `REVIEW_STAR_COLOR = '#EAB308'` in `constants.js`.

## End-to-end: how a review appears

```text
1. Owner marks booking complete (mobile Supabase update)
2. If eligible → POST review-invite → server inserts review_invites + emails customer
3. Customer opens link in email → submits review on web (creates reviews row)
4. Owner sees review in Reviews inbox; public row appears when is_hidden = false
5. Owner may post owner_reply_body from mobile
```

## Tests

| Path                                                             | Covers                        |
| ---------------------------------------------------------------- | ----------------------------- |
| `reviews/__tests__/reviewInviteEligibility.test.js`              | Eligibility helpers           |
| `reviews/utils/__tests__/reviewModel.test.js`                    | Row mapping, reply validation |
| `reviews/utils/__tests__/filterReviews.test.js`                  | Inbox filters                 |
| `reviews/utils/__tests__/reviewBodyPreview.test.js`              | Show more/less truncation     |
| `reviews/utils/__tests__/formatReviewDateLabel.test.js`          | Date labels                   |
| `bookings/booking-details/__tests__/bookingCompleteCopy.test.js` | Mark-complete sheet copy      |

Run:

```bash
npm test -- --testPathPattern=features/reviews
```

## Module map

```text
src/features/reviews/
├── api/
│   ├── reviews.js                    # fetch list (owner/public), update reply
│   └── loadReviewEligibilityContext.js
├── hooks/
│   ├── useReviewsInbox.js
│   └── useSubmitReviewReply.js
├── screens/ReviewsScreen.jsx
├── components/                       # StarRating, ReviewCard, summary, etc.
├── utils/
│   ├── reviewModel.js
│   ├── reviewInviteEligibility.js
│   ├── buildReviewsSummary.js
│   └── filterReviews.js
├── constants.js
└── queryKeys.js

Related (outside feature folder):
├── bookingLink/hooks/useBookingLinkPublicReviews.js
├── bookingLink/preview/components/PublicReviewRow.jsx
├── bookingLink/preview/components/ReviewsTabContent.jsx
├── bookings/booking-details/api/postReviewInviteForBooking.js
├── bookings/booking-details/api/completeBookingWithReviewInvite.js
└── bookings/booking-details/hooks/useMarkBookingCompleteFlow.js
```

## Related docs (web / server)

On the Next.js repo (not in this mobile tree):

- `src/features/reviews/docs/FLOWS.md` — full E2E (web + mobile)
- `src/features/reviews/docs/REVIEW_INVITES_TABLE.md` — `review_invites` schema

When changing eligibility or invite behavior, keep mobile `reviewInviteEligibility.js` and `loadReviewEligibilityContext.js` aligned with web `reviewInviteEligibility.ts`.

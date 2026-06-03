# Server contract: notify owner when a customer submits a review

Hand this to whoever implements the **Next.js / server** side. Mobile already handles inbox, Realtime, push registration, and (after this contract) **tap → Reviews screen**.

**Mobile does not need route names or screen paths from the server.** Routing uses only `reference_type` + `reference_id` (same as bookings and quotes).

---

## When to fire

On the code path where a customer **successfully submits a review** (after the `reviews` row is committed):

1. Insert one row into **`public.notifications`** for the business owner.
2. Send an **Expo push** to that owner’s device token(s) from **`user_push_tokens`** (service role read).

Use the same Supabase project and `user_id` as the mobile app for that environment.

---

## `notifications` row (required fields)

| Column           | Value                            | Notes                                                                                               |
| ---------------- | -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `user_id`        | Owner’s **`auth.users.id`**      | From `business_profiles.profile_id` for the review’s `business_id`. **Not** `business_profiles.id`. |
| `type`           | `review_submitted`               | Stable machine string (alternatives OK if they contain `review`, e.g. `review.received`).           |
| `reference_type` | **`review`**                     | **Required for mobile navigation.** Must be exactly this string (lowercase).                        |
| `reference_id`   | UUID of the new **`reviews.id`** | Used for dedupe/audit. Mobile opens the **Reviews list**, not a single review detail.               |
| `title`          | `New review`                     | Optional; mobile shows this if present.                                                             |
| `body`           | e.g. `From Jordan`               | Optional subtitle in inbox. Prefer **`metadata.customerName`** instead (see below).                 |
| `read`           | `false`                          | Default.                                                                                            |
| `dedupe_key`     | `review:{reviewId}`              | **Recommended** — idempotent on webhook retries.                                                    |

### Optional `metadata` (recommended)

```json
{
  "customerName": "Jordan"
}
```

Mobile inbox subtitle: **“From Jordan”** (via existing subtitle helper).

---

## Expo push payload (required `data` keys)

Send push **after** (or in parallel with) the notification insert. **`data` must match the DB row for routing:**

```json
{
  "to": "ExponentPushToken[…]",
  "title": "New review",
  "body": "From Jordan",
  "data": {
    "reference_type": "review",
    "reference_id": "<reviews.id uuid>"
  }
}
```

- **`reference_type`** and **`reference_id`** are required for tap navigation (banner and cold start).
- Mobile accepts **snake_case** (`reference_type`) or **camelCase** (`referenceType`).
- **`reference_id` is not used to scroll to one review** — app opens the **Reviews inbox screen** only.

---

## What mobile does with this (no server action)

| User action                             | Mobile behavior                                             |
| --------------------------------------- | ----------------------------------------------------------- |
| New row in `notifications`              | Inbox + bell badge update (React Query + Realtime).         |
| Tap row in in-app inbox                 | Mark read → navigate to **More → Reviews**.                 |
| Tap phone banner / open from killed app | Same navigation via `data.reference_type` / `reference_id`. |

Server **never** sends React Navigation route names, deep links, or tab names.

---

## Checklist before shipping

- [ ] `user_id` is owner auth uid, not customer id.
- [ ] `reference_type` is **`review`** (not `reviews`, not `booking`).
- [ ] Push `data` includes **`reference_type`** + **`reference_id`**.
- [ ] `dedupe_key` set so double-submit doesn’t duplicate notifications.
- [ ] Expo send uses **`EXPO_ACCESS_TOKEN`**; token read uses **Supabase service role**.

---

## Related mobile docs

- [`notifications-integration.md`](./notifications-integration.md) — full notifications architecture.
- [`../../reviews/docs/reviews-feature.md`](../../reviews/docs/reviews-feature.md) — reviews data model on mobile.

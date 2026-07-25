# Contract: Server — Owner manual booking schedule override

**Status:** Confirmed — server already implements the owner bypass on this branch.
**Server route:** `POST /api/public/bookings` (`src/app/api/public/bookings/route.ts` in the web repo)
**Applies only when:** `ownerManualBooking === true` (owner Bearer JWT present and owns `businessId`)

Companion to [`OWNER_MANUAL_BOOKING_SERVER.md`](./OWNER_MANUAL_BOOKING_SERVER.md) — that doc stays the source of truth for the payload. This doc covers **schedule validation** for owner vs public.

---

## Goal

When the **owner** books on behalf of a customer, they should have more freedom than a customer self-serving from the public booking link. The owner knows their own calendar and may legitimately want to squeeze someone in last minute or work during a day they marked off.

A customer booking through `/[slug]/book` must keep lead-time and time-off restrictions.

---

## Confirmed rules (route behavior)

| Rule                             | Public customer booking                                  | Owner manual booking                     | Enforced on this route?         |
| -------------------------------- | -------------------------------------------------------- | ---------------------------------------- | ------------------------------- |
| Lead time (`minimum_notice`)     | Enforce → `409` “too soon to book”                       | **Skip**                                 | Yes                             |
| Time off (`time_off_blocks`)     | Enforce → `409`                                          | **Skip**                                 | Yes                             |
| Free-tier booking cap            | Enforce → `403`                                          | **Enforce** → `403`                      | Yes                             |
| Owner owns `businessId`          | n/a                                                      | **Enforce** → `403`                      | Yes                             |
| Weekly hours (`weekly_schedule`) | Client/UI only                                           | Client/UI only                           | **No**                          |
| Existing booking overlap         | Not transactional                                        | Not transactional                        | **No** (doc already notes this) |
| Start time in the past           | Blocked via lead-time helper (`none` still rejects past) | **Allowed** (whole public block skipped) | Partial                         |
| `accept_bookings` off            | Not read by API (public page hides calendar)             | **Allowed** (route never reads it)       | **No**                          |

### Implementation shape (web repo)

```ts
if (!ownerManualBooking) {
  // time-off check → 409
  // lead-time check → 409 (“too soon to book”)
}
```

Owners skip both checks in one guard. Time-off blocks may be single-day or a date range, all-day or timed — see `src/features/availability/AVAILABILITY_FEATURE.md` (mobile repo).

`minimum_notice` values: `none | 30m | 1h | 2h | 3h | 4h | 8h | 12h | 24h | 48h | 72h | 1w`.

---

## Confirm-back (from server, 2026-07-25)

1. **Time-off bypass for owners** — Done. Owner create through all-day / timed / multi-day time off returns `201`, not `409`. If mobile still sees `409`, the build hasn’t picked up this server deploy yet.
2. **Lead time** — Validated server-side for public; skipped for `ownerManualBooking: true`. (Older error tables that omitted min-notice are outdated.)
3. **`accept_bookings: false`** — Does not block owners (or anyone on this route). Visibility is slug / public-profile live checks only.
4. **Other schedule validation** — See table above. Intentional owner freedom: time off + lead time skipped. Known gaps vs a stricter policy: past slots allowed for owners; weekly hours / double-book not enforced on create; public `accept_bookings` not enforced on the API.

**Not required to unblock mobile Confirm.** Optional follow-ups only if product wants a stricter contract: reject past slots for owners; enforce `accept_bookings` for `!ownerManualBooking`.

---

## Not changing

- Request and response bodies are unchanged. `ownerManualBooking: true` is the only signal.
- No database migration.
- Owner notifications, customer confirmation email, `booking_payments`, and free-tier enforcement stay as-is.
- `409` remains valid for public customers who hit time off or lead time.

---

## Mobile side (already implemented)

Owner create and edit pass `ownerManualBooking: true` into the shared booking calendar, so the slot picker:

- **Skips** lead time and time off
- **Still applies** weekly hours, existing-booking overlap, and “not in the past” (client-side)
- Treats the schedule as open even when `accept_bookings` is off

| Piece             | Location                                                                           |
| ----------------- | ---------------------------------------------------------------------------------- |
| Slot filter       | `src/features/availability/booking/utils/slotGeneration.js`                        |
| Schedule context  | `src/features/availability/booking/utils/bookingCalendar.js`                       |
| Calendar hook     | `src/features/availability/booking/hooks/useBookingCalendar.js`                    |
| Owner create flow | `src/features/bookings/create-appointment/hooks/useCreateAppointmentController.js` |
| Owner edit flow   | `src/features/bookings/edit-appointment/hooks/useEditAppointmentController.js`     |

**Scope note:** owner **edit / reschedule** updates `bookings` via Supabase (`updateBookingById`, `rescheduleBookingById`) and never hits this route. Override behavior for create depends on this route + deploy.

---

## Acceptance tests (aligned to current route)

Owner manual booking (`ownerManualBooking: true`, valid owner Bearer):

| #   | Setup                                              | Expected |
| --- | -------------------------------------------------- | -------- |
| 1   | All-day time off covering date                     | `201`    |
| 2   | Timed time off overlapping requested start         | `201`    |
| 3   | Multi-day range time off covering date             | `201`    |
| 4   | `minimum_notice = '24h'`, slot 30 minutes from now | `201`    |
| 5   | `accept_bookings = false`                          | `201`    |
| 6   | Free-tier cap reached                              | `403`    |
| 7   | Bearer user does not own `businessId`              | `403`    |

Public customer booking (no `ownerManualBooking`):

| #   | Setup                                   | Expected                                                                         |
| --- | --------------------------------------- | -------------------------------------------------------------------------------- |
| 8   | Slot inside time off                    | `409`                                                                            |
| 9   | Slot inside the `minimum_notice` window | `409` “too soon to book”                                                         |
| 10  | `accept_bookings = false`               | **Not rejected by this API today** (UI hides calendar; crafted POST can succeed) |

---

## Bottom line

Mobile and server are aligned for the dead-end fix: owners can Confirm through time off and lead time. Ship / point mobile at a build that includes the route guard above; no further server work required for that goal.

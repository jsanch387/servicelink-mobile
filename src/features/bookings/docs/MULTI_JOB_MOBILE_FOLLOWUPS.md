# Multi-job mobile — follow-ups (pick up next)

**Context (2026-07-28):** Create + edit + details + Complete + calendar/Next Up/Rest of Today `+N more` shipped. Sale line in confirmation email is a **server** fix.

## Do next

1. **Server amount-due for Complete** (if `job_completed` still sums top-level columns only)  
   Mobile Complete + Mark as paid + Tap to Pay already collect the full visit total from `job_details`.  
   Edit now denormalizes visit rollup into `service_price_cents` + flattened `addon_details` so that math matches after an edit.  
   Confirm **create** also stores visit rollup (not first-job-only) on those columns, **or** update server to sum `job_details`.

## Nice later

- Per-job vehicles on list cards (from `job_details`) — Next Up is fine without this
- Align or retire unused `bookingTitleLine` if revived

## Already in good shape (mobile)

- Create submit with `jobs[]`
- Edit appointment (multi-job hub / per-job service, add-ons, vehicle)
- Booking details multi-job Summary
- Complete visit Payment breakdown (all jobs + amount due from `job_details`)
- Calendar day planner + BookingCard `+N more`
- Next Up `+N more` (muted, smaller than service name)
- Rest of Today timeline `+N more` (muted, next to service name)

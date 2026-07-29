# Multi-job mobile — follow-ups (pick up next)

**Superseded for current behavior:** use [`MOBILE_APPOINTMENT_LIFECYCLE.md`](./MOBILE_APPOINTMENT_LIFECYCLE.md).

**Context (2026-07-28 → 2026-07-29):** Create + edit + details + Complete + calendar/Next Up/Rest of Today `+N more` shipped. Edit now writes `job_details` for single-job (incl. add-ons); details/complete/earnings heal empty job add-ons from `addon_details`. Visit hub has top-level **Add-ons**. Today’s earnings treats completed visits as remaining $0.

## Do next

1. **Server amount-due for Complete** — confirm production has the same `addon_details` fallback when `job_details` add-ons are empty (mobile already heals).

## Nice later

- Per-job vehicles on list cards (from `job_details`) — Next Up is fine without this
- Align or retire unused `bookingTitleLine` if revived

## Already in good shape (mobile)

- Create submit with `jobs[]`
- Edit appointment (visit hub: Jobs + Add-ons; job hub: service/pricing + vehicle)
- Booking details Summary job cards (single + multi)
- Complete visit line items + amount-due heal
- Today’s earnings multi-job sum + completed = settled
- Calendar day planner + BookingCard `+N more`
- Next Up / Rest of Today `+N more`

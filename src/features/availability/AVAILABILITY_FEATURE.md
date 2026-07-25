# Availability Feature

Controls when a business accepts bookings: weekly hours, **time off** (single day or ranges), and **lead time** (minimum booking notice). One row per business in `business_availability`.

## Folder Structure

- `api/availability.js`
  - Read + upsert for `business_availability` (`fetchBusinessAvailability`, `saveBusinessAvailability`).
- `hooks/useBusinessAvailability.js`
  - Loads business context + availability row, returns a UI-ready model.
- `hooks/useSaveBusinessAvailability.js`
  - Upsert mutation keyed by `business_id`.
- `utils/availabilityModel.js`
  - Day/preset definitions, 12h↔24h helpers.
  - Time off: `resolveTimeOffDateRange`, `advanceTimeOffDateSelection`, `normalizeTimeOffBlocksForSave`, `validateTimeOffBlocks`, `TIME_OFF_ALL_DAY_START/END`.
  - Lead time: `MINIMUM_NOTICE_OPTIONS`, `normalizeMinimumNotice`, `minimumNoticeToMinutes`.
- `components/WeeklyScheduleSection.jsx` / `WeeklyScheduleCard.jsx`
  - Weekly day toggles + start/end pickers.
- `components/TimeOffSection.jsx`
  - Time off list card (date tile, range/hours meta, delete with confirm).
- `components/TimeOffSheet.jsx`
  - Add-time-off sheet: range calendar, All day toggle, start/end, optional note.
- `components/LeadTimeSection.jsx`
  - Lead time picker card.
- `screens/AvailabilityScreen.jsx`
  - Accept-bookings toggle, weekly schedule, time off, lead time, sticky Save.
- `booking/` — shared booking calendar/slot logic (see “Booking impact”).

## Backend Contract

`business_availability` (one row per business):

- `accept_bookings` (boolean)
- `selected_preset` (text)
- `weekly_schedule` (jsonb, by weekday key: `{ start, end, enabled }`)
- `time_off_blocks` (jsonb array — see below)
- `minimum_notice` (text — see below)

Save = upsert the whole row by `business_id`. No separate tables for time off or lead time.

---

## Time off

Lets a business block dates — a single day or a range, all-day or specific hours, with an optional note. Stored entirely in `time_off_blocks`; **no migration needed** to evolve the object shape.

### Block shape (canonical)

```json
{
  "id": "uuid",
  "start_date": "2026-07-24",
  "end_date": "2026-07-27",
  "all_day": true,
  "start_time": "00:00",
  "end_time": "23:59",
  "title": "Vacation"
}
```

| Field                     | Rules                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `id`                      | Required string (UUID), max ~80 chars                                                              |
| `start_date` / `end_date` | `YYYY-MM-DD`, inclusive; `end_date >= start_date`                                                  |
| `date`                    | Optional legacy field; written equal to `start_date` when single-day so older readers keep working |
| `all_day`                 | Boolean; when true, times are stored as `00:00` / `23:59`                                          |
| `start_time` / `end_time` | `HH:mm` 24h; required when not all-day; end after start                                            |
| `title`                   | Optional note, trimmed, max 500                                                                    |

**Backward compatibility:** legacy blocks with only `{ date, start_time, end_time }` still work — `resolveTimeOffDateRange` treats `date` as both start and end.

### Add sheet (`TimeOffSheet`)

- Month calendar in a card (same `BookingCalendarCard` used in create-appointment).
- Airbnb-style selection via `advanceTimeOffDateSelection`: tap one day, or a second day for a range; tap the same day again to clear; after a full range, next tap restarts.
- **All day** toggle (default on); when off, Start / End pickers appear side by side (same window applies to every day in the range).
- Optional **Note** field.
- Footer: **Cancel** | **Save** (stays pinned above the keyboard).

### List (`TimeOffSection`)

- Empty state: tappable “Add time off” row with a plus.
- Rows: date tile (month + start day) · title or date range · muted meta (`All day` or compact times like `9AM – 5PM`, minutes only when off the hour).
- Delete shows a native confirm before removing.
- Changes are local until the screen’s **Save changes** upserts availability.

### Persistence

1. Edit list in UI (add / remove blocks).
2. On save: `normalizeTimeOffBlocksForSave` → `validateTimeOffBlocks` → upsert `time_off_blocks`.
3. Cap: **200** blocks per business.

---

## Lead time (minimum notice)

How far in advance a customer must book. Stored in `business_availability.minimum_notice`.

### Allowed values (DB check constraint)

`none | 30m | 1h | 2h | 3h | 4h | 8h | 12h | 24h | 48h | 72h | 1w`

- UI options come from `MINIMUM_NOTICE_OPTIONS` (e.g. `24h` shows as **1 day**, `48h`→2 days, `72h`→3 days, `1w`→1 week).
- `normalizeMinimumNotice` coerces unknown/missing values to `none`.
- `minimumNoticeToMinutes` maps a value to minutes for slot filtering (`none` → 0).

### UI (`LeadTimeSection`)

- Section title + card with a wheel picker; sits under Time off on the Availability screen.
- Persisted with the rest of availability via Save changes.

---

## Booking impact (`booking/`)

`parseScheduleInputs` reads `accept_bookings`, `weekly_schedule`, normalized `time_off_blocks`, and `minimum_notice` from the row. `useBookingCalendar` passes these into slot generation.

`generateTimeSlots` hides a candidate start when:

- it falls outside the day’s enabled weekly window, or
- it starts before `now + minimumNoticeToMinutes(minimum_notice)` (lead time), or
- it overlaps an existing booking, or
- a time-off block covers that date (`start_date ≤ day ≤ end_date`): all-day blocks the whole day; otherwise interval-overlap against the block’s `start_time`–`end_time`.

**Owner create / edit appointment** passes `ownerManualBooking: true` into the shared calendar. That mode:

- **Skips** lead time and time off (owners can squeeze someone in last minute or during blocked days).
- **Still applies** weekly hours, existing-booking overlap, and “not in the past.”
- **Allows** scheduling even when `accept_bookings` is off (public booking closed).

Server create (`POST /api/public/bookings` with `ownerManualBooking: true`) matches: time off and lead time are skipped. Details: `src/features/bookings/create-appointment/docs/OWNER_MANUAL_BOOKING_SCHEDULE_OVERRIDE_SERVER.md`.

Customer / public booking and maintenance-invite keep the strict rules.

---

## Web parity checklist

Same DB, same shapes — no migration:

1. **Time off list** — date tile + title/range + `All day`/compact times; confirm before delete.
2. **Add/edit modal** — range calendar, All day, start/end when needed, optional note, Cancel | Save.
3. **Lead time** — picker over the allowed `minimum_notice` values.
4. **Normalize on save** to the shapes above (keep reading legacy `date`).
5. **Booking slots** — enforce weekly window, lead time, existing-booking overlap, and time-off (all-day vs timed) per day in the range.

## Out of scope (today)

- Editing an existing time-off block in place (delete + re-add).
- Recurring time off.
- Separate Postgres tables for time off / lead time.

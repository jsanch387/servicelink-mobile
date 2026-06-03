# Bookings Feature Documentation

This document explains how the bookings feature is structured, how data flows, and how failure states are handled.

## Scope

The bookings feature includes:

- list screen (`BookingsScreen`) — **List** and **Calendar** view modes
- booking details screen (`BookingDetailsScreen`)
- shared booking cards and planner components
- booking details subfolder for details-specific API/hooks/UI

**Calendar mode** (month / week / day) is documented in depth in [`docs/CALENDAR_VIEW.md`](docs/CALENDAR_VIEW.md).

## Folder Structure

- `api/` list/planner/calendar Supabase queries and sorting/filtering helpers
- `hooks/` list, calendar counts, planner day query orchestration
- `components/` list/planner/calendar UI pieces
- `screens/` feature screens
- `docs/` calendar view documentation
- `booking-details/`
  - `api/bookingDetails.js` booking details fetch + status updates
  - `hooks/useBookingDetails.js` details query state
  - `hooks/useBookingActions.js` complete/cancel mutations
  - `components/*` details UI sections and skeleton
  - `utils/buildBookingDetailsModel.js` data-to-UI formatting
- `create-appointment/` — owner FAB wizard; **Confirm** calls Next.js `POST /api/public/bookings` (see `create-appointment/docs/OWNER_MANUAL_BOOKING_SERVER.md`), not direct Supabase inserts
- `__tests__/` unit and hook tests

## Data Flow

### Booking list screen (List mode)

1. `useBookingsList({ listEnabled: true })` loads business context first.
2. Fetch strategy by tab:
   - **Upcoming** — single `fetchConfirmedBookingsFromToday`, then `partitionUpcomingConfirmed` (instant-based).
   - **Past** — month windows via `fetchBookingsForListWindow`; user extends with “Load [month]” link.
   - **Canceled** — single `fetchCancelledBookingsForBusiness` (all rows).
3. `BookingsScreen` groups rows by date and renders `BookingCard`.
4. On card tap, app navigates to details using `bookingId`.

List queries are disabled when the user is in **Calendar** mode (`listEnabled: false`).

### Booking calendar screen (Calendar mode)

See [`docs/CALENDAR_VIEW.md`](docs/CALENDAR_VIEW.md). Summary:

- **Month / Week** — `useBookingsCalendarCounts` for dot density; `useBookingsPlannerDay` for the selected day agenda.
- **Day** — `BookingsDayPlanner` + `useBookingsPlannerDay` for the full timeline.
- Cached ranges and skeleton loading for day cards (no agenda spinner).

### Booking details screen

1. `BookingDetailsScreen` reads `bookingId` from route params.
2. `useBookingDetails(bookingId)` fetches `bookings` row details from Supabase.
3. While pending, `BookingDetailsSkeleton` renders.
4. On success, `buildBookingDetailsModel` maps backend fields into UI-ready sections:
   - schedule (date/time/duration)
   - price breakdown (service + parsed add-ons + total)
   - customer/location/vehicle/notes
5. Status actions call `useBookingActions`:
   - Mark completed -> `POST /api/owner/bookings/:id/complete` (review email when eligible; see `booking-details/docs/BOOKING_COMPLETE_SERVER.md`)
   - Cancel booking -> `status = cancelled`
6. On successful mutation, relevant query keys are invalidated:
   - bookings feature root
   - booking details query
   - home query root

## Error Handling

- API failures are surfaced as user-facing inline card errors.
- Missing booking row returns explicit "Booking not found".
- Dialer/maps actions show graceful alerts when device cannot open URL.
- Action mutations (`complete`, `cancel`) show alert on failure.

## Retry Strategy (Smart/Low-Noise)

Bookings queries use `shouldRetryBookingsQuery`:

- retries at most once
- retries only transient-looking errors (network/timeout/5xx/rate limit text)
- does not retry deterministic failures (not found, RLS, validation, etc.)

This limits accidental backend spam while still recovering from flaky connectivity.

## Testing Coverage (Current)

- `bookingsApi` — past/canceled sort, `partitionUpcomingConfirmed`
- `calendarRange`, `calendarBookingsIndex`, `listMonthWindows`
- `CalendarMonthPicker` — owner month grid with appointment dots
- `BookingsCalendarDayAgenda` — skeleton and empty states
- `useBookingsList`, `useBookingsCalendarCounts`, `useBookingsPlannerDay`
- `BookingCard` interaction
- `BookingsScreen` — list empty states, calendar mode chrome
- booking details model mapping (duration/add-ons/phone formatting)
- details hook behavior (success, deterministic error, transient retry once)
- retry policy behavior
- create-appointment: `buildOwnerManualPublicBookingBody` / `postOwnerManualPublicBooking` unit tests

Run: `npm test -- --testPathPattern=bookings`

## Notes for Future Enhancements

- Wire real booking notes source once backend field is available.
- If add-ons move to relational joins, extend details API instead of model parser.
- Add integration tests for action buttons (complete/cancel) via screen-level tests.

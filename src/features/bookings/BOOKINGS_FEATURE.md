# Bookings Feature Documentation

This document explains how the bookings feature is structured, how data flows, and how failure states are handled.

## Scope

The bookings feature includes:

- list screen (`BookingsScreen`)
- booking details screen (`BookingDetailsScreen`)
- shared booking cards and planner components
- booking details subfolder for details-specific API/hooks/UI

## Folder Structure

- `api/` list/planner Supabase queries and sorting/filtering helpers
- `hooks/` list/planner query orchestration
- `components/` list/planner UI pieces
- `screens/` feature screens
- `booking-details/`
  - `api/bookingDetails.js` booking details fetch + status updates
  - `hooks/useBookingDetails.js` details query state
  - `hooks/useBookingActions.js` complete/cancel mutations
  - `components/*` details UI sections and skeleton
  - `utils/buildBookingDetailsModel.js` data-to-UI formatting
- `__tests__/` unit and hook tests

## Data Flow

### Booking list screen

1. `useBookingsList` loads business context first.
2. It then loads bookings for the active tab (upcoming/past/cancelled).
3. `BookingsScreen` groups rows by date and renders `BookingCard`.
4. On card tap, app navigates to details using `bookingId`.

### Booking details screen

1. `BookingDetailsScreen` reads `bookingId` from route params.
2. `useBookingDetails(bookingId)` fetches `bookings` row details from Supabase.
3. While pending, `BookingDetailsSkeleton` renders.
4. On success, `buildBookingDetailsModel` maps backend fields into UI-ready sections:
   - schedule (date/time/duration)
   - price breakdown (service + parsed add-ons + total)
   - customer/location/vehicle/notes
5. Status actions call `useBookingActions`:
   - Mark completed -> `status = completed`
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

- `bookingsApi` sorting/filter helpers
- `BookingCard` interaction
- booking details model mapping (duration/add-ons/phone formatting)
- details hook behavior (success, deterministic error, transient retry once)
- list hook behavior (success + list failure handling)
- retry policy behavior

## Notes for Future Enhancements

- Wire real booking notes source once backend field is available.
- If add-ons move to relational joins, extend details API instead of model parser.
- Add integration tests for action buttons (complete/cancel) via screen-level tests.

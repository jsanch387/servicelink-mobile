# Rest of Today Card

This folder contains the Home dashboard "Rest of Today" section implementation.

## Purpose

Show a compact timeline of **today's confirmed bookings** so the owner can quickly see what's left in the day.

## Data flow

1. `useHomeDashboard` calls `fetchConfirmedBookingsForToday` from `src/features/home/api/restOfToday.js`.
2. The query fetches bookings from Supabase `bookings` table where:
   - `business_id` matches the current business
   - `status = 'confirmed'`
   - `scheduled_date = localYyyyMmDd()`
3. Rows are mapped by `mapBookingsToRestOfTodayItems` in `src/features/home/utils/restOfToday.js`.
4. `HomeScreen` passes mapped items + loading/error state to `RestOfTodayCard`.

## UI states in `RestOfTodayCard`

- **Loading:** skeleton timeline rows
- **Error:** inline card error message
- **Empty:** "No more bookings scheduled for today."
- **Ready:** timeline of booking `time`, `service`, and optional `vehicle`

## Why structured this way

- Keeps backend querying in `api/`
- Keeps row-to-view-model shaping in `utils/`
- Keeps UI state handling in a focused component folder
- Makes this section easy to extend without bloating `HomeScreen`

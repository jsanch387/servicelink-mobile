# Availability Feature

This feature controls when a business accepts bookings and how weekly availability + time-off blocks are configured.

## Folder Structure

- `api/availability.js`
  - Supabase read queries for `business_availability`.
- `hooks/useBusinessAvailability.js`
  - Loads business context (`business_profiles`) and availability row.
  - Returns a UI-ready model + loading/error/refetch state.
- `utils/availabilityModel.js`
  - Canonical day and preset definitions.
  - Converts backend time format (`HH:mm`) to UI format (`h:mm AM/PM`).
  - Builds default + normalized UI model from DB rows.
- `components/TimeOffSheet.jsx`
  - Bottom-sheet form for adding a time-off block (UI-first currently).
- `screens/AvailabilityScreen.jsx`
  - Main feature screen with:
    - accept bookings toggle
    - working-hours preset chooser
    - weekly schedule editor
    - time-off section
    - floating Save button (no save behavior yet)

## Backend Contract

Reads from one row per business in `business_availability`:

- `accept_bookings`
- `selected_preset`
- `weekly_schedule` (JSON by weekday key)
- `time_off_blocks` (JSON array)

## Current Behavior

- Screen hydrates from backend availability row when available.
- If no row is returned, UI falls back to defaults from `availabilityModel`.
- Time values are displayed and edited in 12-hour format.
- Floating `Save` button is active:
  - enabled only when local UI differs from fetched model
  - saves via upsert to `business_availability` by `business_id`
  - disabled again after successful save/refetch

## Next Implementation Step

- Persist `time_off_blocks` from `TimeOffSheet` actions (create/edit/delete list rows in UI + save).

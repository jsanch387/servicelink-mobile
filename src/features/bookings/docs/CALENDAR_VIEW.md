# Bookings calendar view (mobile)

This document describes the **Calendar** mode on the Bookings screen: how month / week / day views work, what data is fetched, how caching behaves, and common edge cases.

For list tabs (Upcoming / Past / Canceled), booking details, and create-appointment flow, see [`../BOOKINGS_FEATURE.md`](../BOOKINGS_FEATURE.md).

## Overview

Owners switch between **List** and **Calendar** with the floating toggle (`BookingsViewModeToggle`). Calendar mode has three granularities (`BookingsCalendarGranularityTabs`):

| Tab       | UI                                        | Primary use                              |
| --------- | ----------------------------------------- | ---------------------------------------- |
| **Month** | `CalendarMonthPicker` + day agenda        | Scan a month, tap a day, see cards below |
| **Week**  | Sunday-first week strip + same day agenda | Week-at-a-glance with dots, tap a day    |
| **Day**   | `BookingsDayPlanner` timeline             | Hour grid for one day, all statuses      |

State on `BookingsScreen`:

- `viewMode` — `list` \| `calendar`
- `calendarGranularity` — `day` \| `week` \| `month`
- `anchorDate` — selected calendar day (local)
- `visibleMonthStart` — first day of month shown in month picker (drives count fetch)

## Architecture

```
BookingsScreen
├── List mode → useBookingsList (upcoming / past / canceled)
└── Calendar mode
    ├── useBookingsCalendarCounts (month or week range → dots only)
    └── useBookingsPlannerDay (single day → full rows for agenda / day planner)
```

List queries are **disabled** when `viewMode === calendar` (`listEnabled: false`) so list and calendar do not fight for bandwidth.

## Data loading

### 1. Calendar dots (month & week only)

**Hook:** `useBookingsCalendarCounts`  
**API:** `fetchBookingsCountsForCalendarRange(businessId, start, end)`  
**Select:** `scheduled_date`, `status` only (lightweight)  
**Index:** `bookingCountsFromScheduledRows` → `Record<YYYY-MM-DD, number>`

| Granularity | Range (`calendarRange.js`)                                             |
| ----------- | ---------------------------------------------------------------------- |
| Month       | `getMonthDateRangeKeys(visibleMonthStart)` — full visible month        |
| Week        | `getWeekDateRangeKeys(anchorDate)` — Sunday–Saturday containing anchor |
| Day         | Counts query **off** (planner loads the day directly)                  |

**Caching (TanStack Query v5):**

- Query key: `bookingsCalendarCountsQueryKey(businessId, start, end)` — one cache entry per range.
- `placeholderData: keepPreviousData` — previous month/week dots stay visible while the next range loads.
- `staleTime` 5 minutes, `gcTime` 30 minutes — navigating back to a visited month/week reuses cache without refetch (until stale).

### 2. Selected day (month & week agenda + day planner)

**Hook:** `useBookingsPlannerDay(yyyyMmDd)` — `null` when planner/agenda inactive  
**API:** `fetchBookingsForPlannerDay(businessId, date)`  
**Select:** `PLANNER_BOOKING_SELECT` (full card fields, all statuses)

| UI                  | When hook is active                             |
| ------------------- | ----------------------------------------------- |
| Month / week agenda | `calendarAgendaEnabled` → `anchorDateStr`       |
| Day planner         | `calendarGranularity === day` → `anchorDateStr` |

**Loading UX:**

- `isDayPending` — no cached row for this day yet → `BookingCardSkeleton` in agenda / planner (not a spinner).
- Cached day → cards show immediately; background refetch does not flash skeleton.

### 3. List mode (reference)

| Tab      | Strategy                                                                      |
| -------- | ----------------------------------------------------------------------------- |
| Upcoming | Single `fetchConfirmedBookingsFromToday`, client `partitionUpcomingConfirmed` |
| Past     | Month windows, infinite query, “Load April 2026” link                         |
| Canceled | Single `fetchCancelledBookingsForBusiness` (no cap)                           |

## UI components

| Component                               | Role                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `BookingsCalendarView`                  | Shell: granularity tabs + month scroll / week scroll / day planner                 |
| `CalendarMonthPicker` (`components/ui`) | Month grid; **owner mode** when `bookingCountByDateKey` is passed (density + dots) |
| `BookingsCalendarWeekView`              | Week nav + day strip + agenda                                                      |
| `BookingsCalendarDayAgenda`             | Date header + `BookingCard` list or empty state                                    |
| `BookingsDayPlanner`                    | Day timeline, now line, all statuses                                               |
| `BookingCardSkeleton`                   | Shared loading placeholder                                                         |

In the month grid, today’s cell uses a ring border (`dayInnerToday`); the selected day uses a filled primary background.

## Query keys

Defined in `queryKeys.js` under `BOOKINGS_QUERY_ROOT`:

- `['bookings', 'calendarCounts', businessId, start, end]`
- `['bookings', 'plannerDay', businessId, yyyyMmDd]`
- `['bookings', 'list', filter, businessId]`

Pull-to-refresh in calendar mode refetches both `calendarCounts` and `plannerDay` active queries.

## Edge cases & product rules

1. **Upcoming vs “today” on calendar** — List upcoming uses instant-based `partitionUpcomingConfirmed`. Calendar month/week counts include all rows in range by `scheduled_date`; planner day shows every status for that day.
2. **Past list “today” rows** — Past tab uses `filterPastConfirmedRows` (instant before now). Calendar does not use that filter on the planner day fetch.
3. **Month navigation** — Changing month updates `visibleMonthStart` → new count range fetch. Returning to a prior month hits cache if still fresh.
4. **Week spanning months** — One week query covers Sun–Sat even when the week crosses month boundaries.
5. **Empty days** — No dots; agenda shows “Nothing scheduled this day.”
6. **No business** — Planner shows setup copy; list/calendar errors surface via `businessError`.
7. **Vehicle line on cards** — Omitted when empty (no “Vehicle not provided” placeholder).
8. **Free tier strip** — Shown in both list and calendar when not Pro (same as list).
9. **Focus refetch** — `useFocusEffect` refetches stale active `BOOKINGS_QUERY_ROOT` queries when the screen gains focus (list + calendar).

## File map

```
src/features/bookings/
├── screens/BookingsScreen.jsx          # viewMode, anchorDate, wires hooks
├── components/
│   ├── BookingsCalendarView.jsx
│   ├── BookingsCalendarWeekView.jsx
│   ├── BookingsCalendarDayAgenda.jsx
│   ├── BookingsDayPlanner.jsx
│   └── BookingCardSkeleton.jsx
├── hooks/
│   ├── useBookingsCalendarCounts.js
│   └── useBookingsPlannerDay.js
├── utils/
│   ├── calendarRange.js
│   └── calendarBookingsIndex.js
└── api/bookings.js                     # fetchBookingsCountsForCalendarRange, fetchBookingsForPlannerDay
```

Shared UI: `src/components/ui/CalendarMonthPicker.jsx`, `AppointmentCountMarkers.jsx`.

## Tests

| File                                           | Covers                                           |
| ---------------------------------------------- | ------------------------------------------------ |
| `__tests__/calendarRange.test.js`              | Month/week range keys, week day array            |
| `__tests__/calendarBookingsIndex.test.js`      | Count index, invalid dates skipped               |
| `__tests__/BookingsCalendarDayAgenda.test.jsx` | Skeleton + empty states                          |
| `__tests__/useBookingsCalendarCounts.test.jsx` | Count fetch + disabled                           |
| `__tests__/useBookingsPlannerDay.test.jsx`     | Day fetch, disabled when no date                 |
| `__tests__/useBookingsList.test.jsx`           | List fetch strategies                            |
| `__tests__/listMonthWindows.test.js`           | Past pagination windows                          |
| `__tests__/bookingsApi.test.js`                | `partitionUpcomingConfirmed`, past/canceled sort |
| `__tests__/BookingsScreen.test.jsx`            | Empty states, calendar mode chrome               |

Run bookings tests:

```bash
npm test -- --testPathPattern=bookings
```

## Related docs

- [`../BOOKINGS_FEATURE.md`](../BOOKINGS_FEATURE.md) — feature-wide structure and list/details
- [`../create-appointment/docs/OWNER_MANUAL_BOOKING_SERVER.md`](../create-appointment/docs/OWNER_MANUAL_BOOKING_SERVER.md) — owner manual booking API

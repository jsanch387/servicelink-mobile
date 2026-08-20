# Payments → Revenue (mobile)

Ship notes for the **Revenue** tab on Payments. Settings (Stripe Connect, deposits, Tap to Pay) stays separate and gated.

## Product rules

| Rule             | Detail                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What counts**  | Appointments with `bookings.status = 'completed'` only. Confirmed / pending / canceled never appear.                                                      |
| **Amount**       | Same “fully collected” idea as Home `todaysEarnings`: `computeBookingEarningsCents` treats completed jobs as settled (`collectedCents = potentialCents`). |
| **Ranges**       | Week (Mon–Sun), Month, Year, All time, Custom (calendar range). Default: **Month**.                                                                       |
| **Compare**      | Week / Month / Year show % vs last week/month/year. Custom shows % vs the same-length prior window. All time has no compare.                              |
| **Empty UX**     | Show `$0` + flat chart. Quiet caption: _Finish a job and it shows up here._ No “no completed jobs this month” banner.                                     |
| **Access**       | **Revenue is open** to free and Pro (conversion). **Settings** stays Pro / Connect gated. Pro without Connect still sees Revenue.                         |
| **Transactions** | Not in v1 UI (tab removed). Mock files may remain for a later ship.                                                                                       |

## User flows to verify

1. **New / empty business** — Revenue shows `$0`, flat chart, Jobs paid `0`, empty caption. Switching Week/Month/Year/All/Custom stays empty.
2. **Has completed jobs** — Amount, chart bars, Jobs paid, Best day/week/month, and (when applicable) % vs prior period match completed work in that range.
3. **Custom range** — Wheel → Custom → calendar. Start and end dates required (not a single day). Trigger shows `Mar 3–18`. Chart buckets daily (≤31 days), weekly (≤180), or monthly.
4. **Free user** — Can open Revenue; Settings shows web upsell (no in-app subscribe CTA).
5. **Pro, no Connect** — Revenue works; Settings shows Connect setup.
6. **Pro + Connect** — Revenue + full Settings.

## Architecture

```
PaymentsScreen
  └─ PaymentsScreenTabs (Revenue | Settings)
  └─ PaymentsRevenueSection          ← always when Revenue tab
       └─ usePaymentsRevenue
            ├─ revenueDateWindow(range) / revenueCustomDateWindow
            ├─ fetchCompletedBookingPayments (current ± previous)
            └─ aggregatePaymentsRevenue → summary
```

### Key files

| Path                                             | Role                                                   |
| ------------------------------------------------ | ------------------------------------------------------ |
| `screens/PaymentsScreen.jsx`                     | Tabs; Revenue ungated; Settings gated                  |
| `components/PaymentsRevenueSection.jsx`          | Amount, range picker, chart, twin cards                |
| `components/PaymentsRevenueRangePicker.jsx`      | Week / Month / Year / All time / Custom wheel          |
| `components/PaymentsRevenueCustomRangeSheet.jsx` | Calendar form hosted in the time-range sheet           |
| `hooks/usePaymentsRevenue.js`                    | React Query + aggregation                              |
| `api/fetchCompletedBookingPayments.js`           | `bookings` ⋈ `booking_payments`, `status = completed`  |
| `utils/revenueDateWindows.js`                    | Inclusive local `YYYY-MM-DD` windows + previous period |
| `utils/aggregatePaymentsRevenue.js`              | Totals, bars, change %                                 |
| `constants/paymentsRevenueRanges.js`             | Range ids + empty caption                              |
| `constants/paymentsScreenTabs.js`                | Revenue + Settings only                                |
| `queryKeys.js`                                   | `paymentsRevenueQueryKey(businessId, range, from, to)` |

### Data query

- Table: `bookings` with nested `booking_payments`.
- Filter: `business_id`, `status = 'completed'`.
- Optional: `scheduled_date` `gte` / `lte` for the selected window (All time = no date filter).
- Order: `scheduled_date`, `start_time` ascending.
- RLS: owner session JWT only.

Previous-period fetch runs for Week / Month / Year / Custom so the UI can show % change. All time skips it. Custom’s prior window is the same number of days immediately before the selected start.

### Chart buckets

| Range    | Bars                                                               |
| -------- | ------------------------------------------------------------------ |
| Week     | 7 weekdays (Mon → Sun)                                             |
| Month    | Exactly **4** weeks: days 1–7, 8–14, 15–21, 22–end (`Wk 1`–`Wk 4`) |
| Year     | 12 months                                                          |
| All time | One bar per year with activity (or current year at `$0` if none)   |
| Custom   | Daily (≤31 days), weekly chunks (≤180 days), else monthly          |

Month does **not** use Mon–Sun calendar weeks (those can spill across months and show 5–6 bars). Week 4 absorbs the remainder of the month (up to day 28–31).

## Earnings alignment

Do **not** invent a second money formula. Revenue uses `computeBookingEarningsCents` from `src/features/home/utils/todaysEarnings.js` so completed jobs match Home.

If Home and Revenue disagree on a completed job, fix the shared helper — not a one-off in `aggregatePaymentsRevenue`.

## Caching

- Query key: `['payments', 'revenue', businessId, range, fromYmd|open, toYmd|open]`
- `staleTime`: 60s · `gcTime`: 15m
- Enabled when `businessId` is set (Custom also needs both dates)

## Tests

| File                                              | Covers                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `__tests__/aggregatePaymentsRevenue.test.js`      | Empty, week/month/year/all/custom, ignore non-completed, change %, same-day sum |
| `__tests__/revenueDateWindows.test.js`            | Window bounds, Monday week start, custom prior window, labels                   |
| `__tests__/fetchCompletedBookingPayments.test.js` | Query filters, missing businessId, errors                                       |
| `__tests__/PaymentsRevenueSection.test.jsx`       | Empty caption vs populated UI, custom trigger label                             |
| `__tests__/advanceRevenueDateSelection.test.js`   | Calendar tap-to-range behavior                                                  |
| `__tests__/PaymentsRevenueRangePicker.test.jsx`   | Close control, no Back, View disabled until start + end                         |
| `__tests__/PaymentsScreen.test.jsx`               | Free user sees Revenue; Pro without Connect keeps Revenue                       |

```bash
npx jest src/features/payments/__tests__/aggregatePaymentsRevenue.test.js \
  src/features/payments/__tests__/revenueDateWindows.test.js \
  src/features/payments/__tests__/fetchCompletedBookingPayments.test.js \
  src/features/payments/__tests__/PaymentsRevenueSection.test.jsx \
  src/features/payments/__tests__/PaymentsScreen.test.jsx \
  src/features/payments/__tests__/advanceRevenueDateSelection.test.js \
  src/features/payments/__tests__/PaymentsRevenueRangePicker.test.jsx \
  --no-coverage
```

## Out of scope (v1)

- Transactions list / ledger UI
- Pending or confirmed jobs in the chart
- In-app subscription purchase (App Store)
- Editing Stripe / deposits from the Revenue tab

## Related

- Home earnings: `src/features/home/utils/todaysEarnings.js`
- Stripe / Connect settings: `src/features/stripe/docs/mobile-stripe-feature-map.md`

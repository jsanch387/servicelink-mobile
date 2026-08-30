# Payments revenue chart — how mobile loads data, and why web can disagree

This is the spec for **replicating the mobile Payments → Revenue chart on web**.

Mobile and web both show a “revenue” headline + chart, but they do **not** share a data model, date window, or money formula today. If a business sees different totals or a different-shaped chart, start here before changing either app.

- Mobile product notes (access, empty UX, tests): [`PAYMENTS_REVENUE.md`](./PAYMENTS_REVENUE.md)
- Web API contract as implemented today: `business-profile/docs/contracts/mobile-payments-revenue.md`

---

## What the mobile chart is

On mobile, Revenue is **completed-job earnings**, not a Stripe ledger.

| Rule                       | Mobile (source of truth for this chart)                                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who is included            | Rows in `bookings` with `status = 'completed'` only. Confirmed, pending, canceled never appear.                                                                                               |
| How much                   | `computeBookingEarningsCents(row).collectedCents` — same helper as Home `todaysEarnings`. A completed job is treated as **fully collected** even if `booking_payments` still shows remaining. |
| When it lands on the chart | The booking’s **`scheduled_date`** (calendar `YYYY-MM-DD`), not payment time, not “marked complete” time.                                                                                     |
| Timezone                   | Device **local calendar**. Windows are inclusive `YYYY-MM-DD` strings. No IANA timezone param.                                                                                                |
| Default range              | **Month** (this calendar month).                                                                                                                                                              |

A job scheduled last Wednesday, completed today, still sits on last Wednesday’s bar.

---

## End-to-end path (mobile)

```
PaymentsScreen
  └─ PaymentsRevenueSection
       └─ usePaymentsRevenue({ businessId })
            ├─ range state: week | month | year | all | custom
            ├─ revenueDateWindow(range)  or  revenueCustomDateWindow(from, to)
            ├─ fetchCompletedBookingPayments  × current window
            ├─ fetchCompletedBookingPayments  × previous window  (skipped for all-time)
            └─ aggregatePaymentsRevenue → { collectedCents, jobsPaid, changePct, bars }
```

React Query key: `['payments', 'revenue', businessId, range, fromYmd|open, toYmd|open]`  
`staleTime` 60s · `gcTime` 15m · Custom is disabled until start **and** end dates are set and different.

### Key files

| File                                                         | Role                                            |
| ------------------------------------------------------------ | ----------------------------------------------- |
| `src/features/payments/hooks/usePaymentsRevenue.js`          | Range state, two fetches, aggregate             |
| `src/features/payments/api/fetchCompletedBookingPayments.js` | Supabase query                                  |
| `src/features/payments/utils/revenueDateWindows.js`          | Inclusive windows + prior period                |
| `src/features/payments/utils/aggregatePaymentsRevenue.js`    | Totals, day map, chart bars, %                  |
| `src/features/home/utils/todaysEarnings.js`                  | `computeBookingEarningsCents` — **do not fork** |
| `src/features/home/utils/bookingStart.js`                    | `calendarYyyyMmDdFromScheduledDate`             |
| `src/features/payments/constants/paymentsRevenueRanges.js`   | Range ids + custom bucket cutoffs               |

---

## 1. Query

Direct Supabase from the owner JWT. RLS scopes rows to the signed-in owner. There is **no** `/api/payments/revenue` call on mobile.

```
from bookings
  select id, scheduled_date, start_time, status, service_name, customer_name,
         job_details, visit_job_count, service_price_cents, addon_details,
         subtotal_cents, discount_cents,
         booking_payments (
           total_amount_cents, paid_online_amount_cents, session_fees_total_cents,
           session_payment_amount_cents, remaining_amount_cents,
           session_payment_method, session_payment_recorded_at
         )
  where business_id = :id
    and status = 'completed'
    [and scheduled_date >= :fromYmd]   -- omitted for All time
    [and scheduled_date <= :toYmd]
  order by scheduled_date, start_time
```

Nested `booking_payments` is used only to **price** the job (`computeBookingEarningsCents`). It is not summed as a cash ledger. Tap to pay, cash, and card on the payment row can change the dollar amount, but they do **not** add a second event.

Previous-period fetch uses the same query with `prevFromYmd` / `prevToYmd`. All time skips it.

---

## 2. Date windows

All bounds are **inclusive** local `YYYY-MM-DD`. “Today” is the device’s local midnight.

| Range        | Current window                                                                         | Previous window (for %)                   |
| ------------ | -------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Week**     | Monday–Sunday containing today                                                         | The Mon–Sun immediately before            |
| **Month**    | 1st → last day of this calendar month                                                  | 1st → last day of last calendar month     |
| **Year**     | Jan 1 → Dec 31 of this calendar year                                                   | Jan 1 → Dec 31 of last calendar year      |
| **All time** | No `scheduled_date` filter                                                             | None (`changePct` is null)                |
| **Custom**   | Inclusive `from`–`to` (swapped if inverted). Start and end must be **different** days. | Same length immediately **before** `from` |

Week starts **Monday** (`weekday === 0` → go back 6 days; else `1 - weekday`).

### Examples (device local, Saturday Aug 29, 2026)

| Range                          | Current                 | Previous                |
| ------------------------------ | ----------------------- | ----------------------- |
| Week                           | Mon Aug 24 → Sun Aug 30 | Mon Aug 17 → Sun Aug 23 |
| Month                          | Aug 1 → Aug 31          | Jul 1 → Jul 31          |
| Year                           | 2026-01-01 → 2026-12-31 | 2025-01-01 → 2025-12-31 |
| Custom Aug 10–Aug 20 (11 days) | Aug 10–20               | Jul 30–Aug 9            |

Month and year include **future days in the calendar period** (rest of this week / rest of this year). Those bars are `$0` until jobs exist. That is intentional.

---

## 3. Money per job

`aggregatePaymentsRevenue` walks each row:

1. Skip unless `status === 'completed'` (defense in depth; the query already filters).
2. `earnings = computeBookingEarningsCents(row)` — skip if null or no calendar day.
3. Add `earnings.collectedCents` to the total and to `byDay[scheduled_date]`.
4. Increment `jobsPaid` by **1 per booking row**, not per payment.

`computeBookingEarningsCents` (Home + Revenue, one helper):

1. Gross = `subtotal_cents` if present, else service + addon cents from visit snapshots.
2. Discount = `min(discount_cents, gross)`.
3. Fees = `booking_payments.session_fees_total_cents`.
4. Computed total = `max(gross - discount + fees, 0)`.
5. If a payment `total_amount_cents` exists and does **not** need discount/fee correction, prefer that total.
6. `potentialCents = max(resolvedTotal, paid_online + session_payment)`.
7. **If status is completed → `collectedCents = potentialCents`** (remaining is forced to `$0`).

So a completed $200 job with $0 recorded on `booking_payments` still charts as **$200**. That is why Home “today’s earnings” and Revenue stay aligned.

Do **not** invent a second formula on web. If a completed job disagrees with Home, fix `computeBookingEarningsCents`.

---

## 4. Chart buckets (`bars`)

Each bar: `{ key, label, fullLabel, cents }`. Zero-height bars are kept so the axis stays complete.

| Range                      | `bucketKind` | Bars                                                                                                                                                                                                                                                         |
| -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Week                       | `daily`      | 7 days Mon→Sun. Label `Mo`…`Su`.                                                                                                                                                                                                                             |
| Month                      | `weekly`     | Exactly **4** segments inside the calendar month: days **1–7, 8–14, 15–21, 22–end**. Axis labels `Wk 1`–`Wk 4`. Selection card / Best week use dates (`Jul 1–7`). Week 4 absorbs day 28–31. **Not** Mon–Sun weeks (those spill months and produce 5–6 bars). |
| Year                       | `monthly`    | 12 months of **this calendar year** (`now.getFullYear()`).                                                                                                                                                                                                   |
| All time                   | `yearly`     | One bar per year that has activity. If none, a single `$0` bar for the current year.                                                                                                                                                                         |
| Custom, ≤31 inclusive days | `daily`      | One bar per day.                                                                                                                                                                                                                                             |
| Custom, 32–180 days        | `weekly`     | Consecutive **7-day chunks from the custom start** (last chunk may be shorter). Not calendar weeks.                                                                                                                                                          |
| Custom, >180 days          | `monthly`    | Calendar months clipped to the custom bounds.                                                                                                                                                                                                                |

Constants: `REVENUE_CUSTOM_DAILY_MAX_DAYS = 31`, `REVENUE_CUSTOM_WEEKLY_MAX_DAYS = 180`.

### Headline + twin cards (for a matching UI)

- Hero amount = `collectedCents` (USD, no cents in the formatter).
- `%` = `changePct` with `compareLabel`: `vs last week` / `vs last month` / `vs last year` / `vs prior period`. Hidden for All time.
- **Jobs paid** = `jobsPaid`.
- **Best day / week / month / year** = the bar with the highest `cents` (title follows `bucketKind`).
- Empty: `$0`, flat chart, Jobs paid `0`, caption _Finish a job and it shows up here._

### Change %

```
previous <= 0  →  current > 0 ? 100 : null
else           →  round(((current - previous) / previous) * 100)
```

---

## What web does today (so the gaps are explicit)

Web: `GET /api/payments/revenue?period=&timeZone=`  
Loader: `business-profile/src/features/payments/revenue/loadOwnerPaymentsRevenue.ts`

| Concern       | Web today                                                                                                                                                                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What counts   | Stripe Connect **net** balance transactions (charges/refunds; payouts excluded) **plus** offline `booking_payments` where `session_payment_method` ∈ `cash` \| `payment_app` \| `other` and `session_payment_amount_cents > 0`. Tap to pay is Stripe-only — do not add it again from `booking_payments`. |
| When it lands | Event `createdAt`: Stripe txn created, or `session_payment_recorded_at`. **Not** `bookings.scheduled_date`.                                                                                                                                                                                              |
| Timezone      | Owner `timeZone` query param (IANA). Windows converted to `fromIso` / `toIso`.                                                                                                                                                                                                                           |
| Week          | Last **7 local days including today** (rolling).                                                                                                                                                                                                                                                         |
| Month         | Last **30 local days including today** (rolling).                                                                                                                                                                                                                                                        |
| Year          | Period id is **`ytd`**: Jan 1 this year → **today** (not Dec 31). Compare = same dates last year.                                                                                                                                                                                                        |
| All time      | Jan 1 **2020** → today (hard floor).                                                                                                                                                                                                                                                                     |
| Custom        | Inclusive YMD; end **clamped to today**; max day cap on web. Prior = equal length before start.                                                                                                                                                                                                          |
| Chart         | Only `day` or `month` buckets (`span > 90` → month). No 4-week month chart, no year-of-years, no custom weekly chunks.                                                                                                                                                                                   |
| Change %      | `previous === 0` → `current === 0 ? 0 : null` (mobile would show `100` when current > 0).                                                                                                                                                                                                                |

Same Saturday Aug 29, 2026, America/Chicago:

| Period     | Web window        | Mobile window       |
| ---------- | ----------------- | ------------------- |
| week       | Aug 23–29         | Aug 24–30 (Mon–Sun) |
| month      | Jul 31–Aug 29     | Aug 1–31            |
| year / ytd | Jan 1–Aug 29 2026 | Jan 1–Dec 31 2026   |

---

## Why the numbers differ (checklist)

Use this when someone reports “mobile says $X, web says $Y.”

### 1. Different money (usually the largest gap)

| Situation                                           | Mobile                                                                       | Web                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| Completed job, payment row incomplete / $0          | Full job price still counts                                                  | Counts only Stripe net and recorded offline cash   |
| Stripe fee                                          | Gross / potential (job price + fees as Home does)                            | **Net** after Stripe fees                          |
| Refund                                              | Job still counts at completed potential unless status is no longer completed | Refund balance txn **subtracts**                   |
| Confirmed job with a card charge                    | **Excluded** (`status !== completed`)                                        | **Included** if Stripe / offline event is in range |
| Completed job, paid next week                       | On the **scheduled** day                                                     | On the **payment** day                             |
| Offline cash / Venmo recorded on `booking_payments` | Folded into the one job total (and only if the booking is completed)         | Separate event on `session_payment_recorded_at`    |
| Tap to pay                                          | Inside `computeBookingEarningsCents` via the payment row                     | Stripe only                                        |
| Payouts                                             | Not a concept                                                                | Excluded (correct)                                 |

### 2. Different windows (same label, different days)

Selecting **Week** or **Month** on both apps is **not** the same interval. Rolling 7 / 30 vs calendar Mon–Sun / calendar month will move jobs in or out and change bar shapes.

**Year** vs **YTD**: mobile includes the rest of the calendar year (empty future months on the chart). Web stops at today and must not be treated as all-time.

**All time**: mobile has no start date; web starts 2020-01-01.

### 3. Different chart grain

A web month chart (30 daily bars) will never look like mobile’s 4 `Wk 1`–`Wk 4` bars even if the dollar total were identical.

### 4. Different % when the prior period is $0

Mobile: jump from $0 → $N is **+100%**. Web: **null** (hidden), or **0%** if both sides are $0.

---

## Replicating the mobile chart on web

To match what owners already see on the phone, web needs a **completed-bookings** path — not a rewrite of the Stripe ledger. The Stripe + offline mix is a different product (closer to Transactions). Keep that API if web still wants “money that actually hit the account.”

### Must match

1. **Universe:** `bookings.status = 'completed'` for the owner’s `business_id`, with nested `booking_payments`.
2. **Amount:** Port `computeBookingEarningsCents` (or call a shared module). Completed → `collectedCents = potentialCents`.
3. **Day key:** `scheduled_date` → `YYYY-MM-DD` (first 10 chars). Bucket in the **owner timezone** the same way mobile uses device local — pick one IANA zone and apply it to “today” and to window bounds, not to payment timestamps.
4. **Windows:** Calendar Mon–Sun week, calendar month, calendar year Jan 1–Dec 31, all-time unbounded, custom inclusive + equal-length prior. Do **not** use rolling 7 / 30 for this chart.
5. **Bars:** Week = 7 days; month = 4 in-month week segments; year = 12 months; all-time = years; custom daily / 7-day chunks / months at 31 and 180.
6. **Compare:** Same prior windows and the mobile `changePercent` (`$0` → positive = 100).
7. **Jobs paid:** Count of completed booking rows with a non-null earnings result, not Stripe charge count.

### Suggested web shape

Either:

- Add a dedicated endpoint, e.g. `GET /api/payments/revenue/jobs?period=week|month|year|all|custom&timeZone=&from=&to=`, that returns `{ collectedCents, jobsPaid, changePct, compareLabel, bucketKind, bars[] }` with the mobile bar objects, **or**
- Keep `GET /api/payments/revenue` for the Stripe/offline ledger and do **not** reuse it for this chart.

Do not merge Stripe net into this chart if the goal is “same number as the phone.”

### Period id mapping

| Mobile `range` | Web query if matching mobile                                            | Do not send                                        |
| -------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| `week`         | `period=week` with **calendar** Mon–Sun                                 | Rolling last 7                                     |
| `month`        | `period=month` with **calendar** month                                  | Rolling last 30                                    |
| `year`         | `period=year` (full calendar year)                                      | `ytd`                                              |
| `all`          | `period=all` with no floor (or a documented floor if product wants one) | Silent 2020 clip without saying so                 |
| `custom`       | `period=custom&from=&to=`                                               | End clamp only if mobile also clamps (it does not) |

---

## Worked example

One completed booking:

- `scheduled_date = 2026-08-26` (Wednesday)
- `status = completed`
- `subtotal_cents = 15000`, no discount
- `booking_payments.total_amount_cents` empty, `session_payment_amount_cents = 0`
- Customer paid cash Friday Aug 28; `session_payment_recorded_at = 2026-08-28T18:00:00Z`

| Surface                                      | Amount                                    | Which bar        |
| -------------------------------------------- | ----------------------------------------- | ---------------- |
| Mobile Week (Aug 24–30)                      | **$150**                                  | Wednesday Aug 26 |
| Web Week (Aug 23–29) if using Stripe/offline | **$150** only if cash is recorded offline | Friday Aug 28    |
| Web Week if the cash row is missing          | **$0**                                    | —                |

Same job, card via Stripe with a $4.65 fee: mobile still **$150** (potential); web Stripe path **~$145** net, dated on the charge.

---

## Tests to port or re-run

Mobile (already exist):

```bash
npx jest src/features/payments/__tests__/aggregatePaymentsRevenue.test.js \
  src/features/payments/__tests__/revenueDateWindows.test.js \
  src/features/payments/__tests__/fetchCompletedBookingPayments.test.js \
  --no-coverage
```

Web should add fixtures that copy those cases: completed-only filter, Monday week, 4 month weeks, custom prior window, completed job with empty payment still counts full price.

# Expenses feature (mobile)

Owner log of money leaving the business. Version one stores charges, shows them on an overview and a month-grouped list, and lets the owner add, edit, or remove a row. It does not compute profit.

How rows are stored, read, and written is in [`expenses-data.md`](./expenses-data.md). The column list in the repo schema index is [`DATABASE_SCHEMA_REFERENCE.md`](../../../../DATABASE_SCHEMA_REFERENCE.md) under **Expenses**. This doc is how the mobile feature uses that table.

## Who can use it

Expenses is an owner office screen.

- **More** shows the row only when `canSeeOffice` is true (`resolveShopCapabilities`). That is the signed-in user who owns the shop (`business_profiles.profile_id === auth user id`). Team members do not see the row.
- **Row level security** matches that gate. `business_expenses` allows select, insert, update, and delete only when `auth_owns_business(business_id)` is true. There is no public read.
- The screen reads the business id from the shared shop profile query (`useExpenseBusiness` → `shopProfileQueryOptions`). Writes use that same id.

## Navigation

Defined in `src/routes/routes.js`:

| Constant          | Screen                                                |
| ----------------- | ----------------------------------------------------- |
| `ROUTES.EXPENSES` | `ExpensesScreen` on the More stack (`/more/expenses`) |

Entry: More → Expenses, last row in the office group (after Marketing and Payments).

## What the owner sees

`ExpensesScreen` opens on **Overview**. **List** does not fetch until that tab is selected.

| Tab          | Loads                                                                     | Shows                                                         |
| ------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Overview** | Current range plus the prior comparison window. All time loads every row. | Total spent, change pill, chart, category bars, range picker. |
| **List**     | The newest month with a charge, then the previous month each time the owner taps Load more. | Register grouped by charge month. Tap a row for details.      |

The list ignores the overview range. Week / Month / Year / All time / Custom filter the overview only.

Empty copy on both tabs is **No expenses yet** / **Add an expense to track it here.** The overview keeps the range picker in the top corner so the owner can switch periods. The message is centered on the screen.

A failed load shows `InlineCardError` and, because there are no rows yet, the empty state under it. A network failure can look like an empty business until the error text is read.

## Add, edit, remove

The add button is always on the screen. The sheet is three steps:

1. **Amount** — dollars, stored later as cents. Continue stays off until the amount is greater than zero.
2. **Details** — name (1–40 characters) and one category. Default category is Other.
3. **Date** — the day the charge posted. Today is preselected, so Done is enough. Past and future days are allowed (a card charge often posts a day or two later, and a planned expense can be dated ahead).

**Done** inserts a row. The sheet stays open and shows an alert if the write fails. Cancel is disabled while the save is in flight.

**Edit** starts from the list, not the chart. Tap a row to open the detail sheet (title **Expense**). **Remove** is on the left. **Edit** is on the right, because that is the action people take more often. Edit closes the detail sheet, waits 320ms, then opens the same wizard prefilled. Stacking two React Native modals is unreliable, so they are not open together. The last button says **Save** and updates that row by id.

**Remove** confirms with `Remove {name}?`, then hard-deletes the row. There is no archive and no undo. The detail sheet stays up until the delete succeeds, and Remove shows a loading state so it cannot be tapped twice.

After a successful save or delete, every `['expenses']` query is invalidated, so the visible tab refetches.

If the charge date sits outside the range currently on Overview, that tab still looks empty. The row is on the list. The default date is today, which is inside Week, Month, and Year.

## Money and fields

The editor speaks dollars. The database stores integer cents. `$64.50` is `6450` (`Math.round(dollars * 100)`). Amounts that round to 0 cents are rejected.

List and overview totals use `formatExpenseDollars`: whole dollars hide cents (`$72`), amounts with cents keep them (`$48.27`). The editor always shows two decimals (`64.50`).

| Field          | Rule                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| `name`         | Trimmed length 1–40. Newlines are flattened while typing.                  |
| `amount_cents` | Integer greater than 0.                                                    |
| `charged_on`   | `YYYY-MM-DD` date. This is the charge day, not `created_at`.               |
| `category`     | `supplies`, `fuel`, `insurance`, `equipment`, or `other`.                  |
| `created_by`   | Auth user id on insert. Cleared if that user is deleted. Not edited later. |

Month grouping on the list is done on the phone from `charged_on`. There is no month table.

## Ranges

Default range is **Month**. Totals run through today. Charts still draw the rest of the period so the shape of the week, month, or year stays visible; future days are zero.

Week starts on Sunday, matching the in-app calendar.

| Range    | Total window                        | Compared with                                 |
| -------- | ----------------------------------- | --------------------------------------------- |
| Week     | Sunday through today                | The previous full Sunday–Saturday week        |
| Month    | 1st of this month through today     | The same day-count in the previous month      |
| Year     | Jan 1 through today                 | Jan 1 through the same calendar day last year |
| All time | Earliest charge through today       | No comparison                                 |
| Custom   | The picked start and end, inclusive | The same-length window immediately before it  |

The overview query asks for the union of the current window and the prior window (`expenseOverviewFetchWindow`), so the change pill does not need a second request. All time has no prior window, so that query has no date filter.

Chart buckets (`buildExpenseChartBars`):

| Range    | Bars                                                                   |
| -------- | ---------------------------------------------------------------------- |
| Week     | Su–Sa                                                                  |
| Month    | Wk 1–4 (days 1–7, 8–14, 15–21, 22–end)                                 |
| Year     | Jan–Dec                                                                |
| All time | Months when history spans fewer than 3 calendar years; otherwise years |
| Custom   | Days up to 31, then weeks up to 180, then months                       |

The change pill is spending versus the prior window (`↑ 150% vs last month`). More spending is the warning color. Less spending is the positive color. All time shows **All expenses** instead of a percent.

Category bars are the selected range only, largest first. Categories with no spend are hidden.

## Loading

| Moment                               | Placeholder                                      |
| ------------------------------------ | ------------------------------------------------ |
| First open, or a range with no cache | Overview skeleton: total, chart, category bars   |
| First open of List                   | List skeleton: two month groups of two-line rows |

Switching back to a range that is still in cache (30 second stale time) does not show the skeleton again. Writes invalidate the cache, so a save still refreshes the screen.

## Data layer

All Supabase calls use the owner session. The client never uses the service role.

| Module                         | Role                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `api/expenses.js`              | Select, insert, update, delete. Maps cents ↔ dollars.                                           |
| `hooks/useExpenseBusiness.js`  | Current user and business id.                                                                   |
| `hooks/useExpensesOverview.js` | Overview query. Disabled while List is selected.                                                |
| `hooks/useExpensesList.js`     | Paged register. Disabled until List is selected.                                                |
| `hooks/useExpenseWrites.js`    | Save (insert or update) and remove. Invalidates `['expenses']`.                                 |
| `queryKeys.js`                 | `['expenses', 'overview', businessId, range, from, to]` and `['expenses', 'list', businessId]`. |

Select list: `id, name, amount_cents, charged_on, category`. Ordered by `charged_on` descending. The index is `(business_id, charged_on desc)`.

`updated_at` is maintained in the database by `trg_business_expenses_set_updated_at`. The app does not send it.

## Screen map

```
ExpensesScreen
  ├─ SegmentedToggle (Overview | List)
  ├─ ExpenseInsights          when Overview has rows in the selected range
  │    ├─ TimeRangePicker
  │    ├─ TrendAreaChart
  │    └─ ExpenseCategoryBars
  ├─ ExpenseList              when List has rows
  │    └─ ExpenseRow → ExpenseDetailSheet
  │         ├─ Remove (left) → confirm → delete
  │         └─ Edit (right) → ExpenseEditorSheet (prefilled)
  ├─ ExpenseEmptyState        when the active tab has nothing to show
  ├─ ExpenseOverviewSkeleton / ExpenseListSkeleton
  └─ AddExpenseFab → ExpenseEditorSheet (blank)
```

Detail layout: the name sits at the top of the amount panel. Amount, Category, and Date are separate panels. No icons and no relative-day caption (no “Yesterday” under the date).

## Left out of version one

- Profit, revenue, and “kept” on the overview. That needs real payment totals. Do not put sample revenue next to real expenses.
- Receipt photos, notes, and extra categories.
- Editing or deleting from the chart. Those actions are on the list detail sheet.
- Overview All time still loads every charge in that range. The list does not: it loads one month at a time.

## Tests

`src/features/expenses/utils/__tests__/summarizeExpenseOutflow.test.js` covers range windows, the prior comparison window, the overview fetch span, totals, chart buckets, and category breakdown.

```bash
npx jest src/features/expenses/utils/__tests__/summarizeExpenseOutflow.test.js --runInBand
```

# Expenses data

What `business_expenses` stores, what the app turns that into, and the exact reads and writes. Product behavior is in [`expenses-feature.md`](./expenses-feature.md). The repo-wide column list is in [`DATABASE_SCHEMA_REFERENCE.md`](../../../../DATABASE_SCHEMA_REFERENCE.md).

All calls go through the signed-in owner's Supabase session (`src/features/expenses/api/expenses.js`). The phone never uses the service role key.

## Table

`public.business_expenses` — one row per charge, owned by one business.

| Column         | Type        | Required | Notes                                                                                |
| -------------- | ----------- | -------- | ------------------------------------------------------------------------------------ |
| `id`           | uuid        | yes      | Primary key. `gen_random_uuid()`. The app does not send this.                        |
| `business_id`  | uuid        | yes      | FK → `business_profiles.id`. Cascade-deletes with the business.                      |
| `name`         | text        | yes      | Trimmed length 1–40.                                                                 |
| `amount_cents` | integer     | yes      | USD cents, greater than 0. `$64.50` is `6450`.                                       |
| `charged_on`   | date        | yes      | `YYYY-MM-DD`. The day the charge posted, not the day it was entered.                 |
| `category`     | text        | yes      | `supplies`, `fuel`, `insurance`, `equipment`, or `other`. Default `other`.           |
| `created_by`   | uuid        | no       | FK → `auth.users.id`. Set on insert. Set null if that user is deleted.               |
| `created_at`   | timestamptz | yes      | `now()` on insert. The app does not send this.                                       |
| `updated_at`   | timestamptz | yes      | `now()` on insert. Trigger `trg_business_expenses_set_updated_at` sets it on update. |

Index: `business_expenses_business_charged_on_idx` on `(business_id, charged_on desc)`.

There is no month column, no receipt, no note, and no soft-delete flag. Removing a row deletes it.

### Example database row

Invented values. Not a real business, user, or expense.

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "business_id": "00000000-0000-4000-8000-000000000002",
  "name": "Home Depot supplies",
  "amount_cents": 6450,
  "charged_on": "2026-09-24",
  "category": "supplies",
  "created_by": "00000000-0000-4000-8000-000000000003",
  "created_at": "2026-09-24T18:12:00Z",
  "updated_at": "2026-09-24T18:12:00Z"
}
```

## What the app keeps in memory

`mapExpenseRow` drops database-only fields and converts cents to dollars. Screens, the list, and the editor all use this shape:

| App field   | From                                                            |
| ----------- | --------------------------------------------------------------- |
| `id`        | `id`                                                            |
| `name`      | `name`                                                          |
| `amount`    | `amount_cents / 100`                                            |
| `chargedOn` | `charged_on`                                                    |
| `category`  | `category`, or `other` if the value is not one of the five keys |

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Home Depot supplies",
  "amount": 64.5,
  "chargedOn": "2026-09-24",
  "category": "supplies"
}
```

`business_id`, `created_by`, `created_at`, and `updated_at` are not selected.

## Who can touch a row

RLS is on. Every policy is `TO authenticated` and calls `auth_owns_business(business_id)`, which is true only when `business_profiles.profile_id = auth.uid()` for that business.

| Policy                           | Command |
| -------------------------------- | ------- |
| `business_expenses_select_owner` | SELECT  |
| `business_expenses_insert_owner` | INSERT  |
| `business_expenses_update_owner` | UPDATE  |
| `business_expenses_delete_owner` | DELETE  |

A team member's session gets zero rows. The More menu also hides Expenses unless `canSeeOffice` is true, which is the same owner check.

## Reads

Both reads use the same select and sort:

```
select id, name, amount_cents, charged_on, category
from business_expenses
where business_id = :businessId
order by charged_on desc
```

`fetchExpensesForBusiness` adds `charged_on >= from` and `charged_on <= to` only when those dates are passed.

| Caller                | When it runs            | Date filter                                                              |
| --------------------- | ----------------------- | ------------------------------------------------------------------------ |
| `useExpensesOverview` | Overview tab is visible | Current range plus the prior comparison window. All time sends no dates. |
| `useExpensesList`     | List tab is visible     | None. Every row for the business.                                        |

Overview does not run while List is open, and List does not run until the owner opens that tab. Each query stays cached for 30 seconds (`staleTime`). Garbage collection is 15 minutes.

Query keys:

| Key                                                           | Cache         |
| ------------------------------------------------------------- | ------------- |
| `['expenses', 'overview', businessId, range, fromYmd, toYmd]` | One window    |
| `['expenses', 'list', businessId]`                            | Full register |

The business id comes from `useExpenseBusiness` (`shopProfileQueryOptions`). The query stays off until that id exists.

Month groups on the list are built on the phone from `chargedOn`. The database is not asked for months.

## Writes

`useExpenseWrites` chooses insert or update from whether the editor was opened with an existing `id`.

Dollars become cents with `Math.round(amount * 100)`. A result of 0 or less is rejected on the phone before the request (`Enter an amount.`). The name is trimmed. The category is forced to one of the five keys.

### Insert (new expense)

Sent columns:

| Column         | Value                           |
| -------------- | ------------------------------- |
| `business_id`  | Current shop id                 |
| `name`         | Trimmed name                    |
| `amount_cents` | Rounded cents                   |
| `charged_on`   | `YYYY-MM-DD` from the date step |
| `category`     | Selected key, or `other`        |
| `created_by`   | Auth user id, or null           |

Not sent: `id`, `created_at`, `updated_at`. Postgres fills those.

The insert returns the same five columns `.single()` and maps them back to the app shape.

### Update (edit)

Sent columns: `name`, `amount_cents`, `charged_on`, `category`.

Matched with `.eq('id', expenseId)`. `business_id` and `created_by` stay as they were. `updated_at` moves via the database trigger.

Returns the updated row the same way as insert.

### Delete (remove)

```
delete from business_expenses
where id = :expenseId
```

No body comes back. RLS still requires the owner. After a successful delete the row is gone.

### After a write

Save and remove both call `invalidateQueries({ queryKey: ['expenses'] })`. Overview and List refetch if they are on screen. A list that has not been opened yet refetches the next time that tab is selected.

## Checks the database enforces

| Check                                     | Meaning                          |
| ----------------------------------------- | -------------------------------- |
| `business_expenses_name_length`           | Trimmed name is 1–40 characters  |
| `business_expenses_amount_cents_positive` | `amount_cents > 0`               |
| `business_expenses_category_check`        | Category is one of the five keys |

A failed write surfaces `error.message` in an alert. The sheet stays open.

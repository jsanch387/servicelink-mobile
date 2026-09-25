# Expenses feature

Owner log of charges for one business: overview, month-grouped list, and add / edit / remove. Version one does not show profit.

**Full reference:** [`docs/expenses-feature.md`](./docs/expenses-feature.md)

**Table, reads, and writes:** [`docs/expenses-data.md`](./docs/expenses-data.md)

**Schema index:** [`DATABASE_SCHEMA_REFERENCE.md`](../../../DATABASE_SCHEMA_REFERENCE.md) — `business_expenses`

## Quick entry points

| Screen / flow      | Module                                                              |
| ------------------ | ------------------------------------------------------------------- |
| Expenses screen    | `screens/ExpensesScreen.jsx`                                        |
| Overview totals    | `hooks/useExpensesOverview.js` → `utils/summarizeExpenseOutflow.js` |
| List (on tab open) | `hooks/useExpensesList.js`                                          |
| Add, edit, remove  | `hooks/useExpenseWrites.js` → `api/expenses.js`                     |
| Add / edit sheet   | `components/ExpenseEditorSheet.jsx`                                 |
| Row detail         | `components/ExpenseDetailSheet.jsx`                                 |

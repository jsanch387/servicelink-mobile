# Payments → Transactions (mobile)

Live feed of **money the owner collected**. The server paints the owner-facing row. Mobile does not reformat cents.

**Server contract (web repo):** `GET /api/payments/transactions`  
**Mobile path:** `API_ROUTES.PAYMENTS_TRANSACTIONS`

The **balance header** is Stripe-only (available / on the way). Cash / payment-app / other still appear as rows.

**Access:** Pro required. Connect optional — offline rows still return with `$0.00` balance.

## Product

```text
Payments → Transactions
  header:  Available $1,247.50
           On the way $320.00
  rows:    Lights                    +$38.54
           Jordan Lee · Tap to pay
           Signature Shine +1 more   +$189.00
           Jordan Lee · Card
           Payout                    $120.00
           Arrived
```

| UI | Field |
| -- | ----- |
| Header | Available hero (`availableCaption` + `availableLabel`) + On the way row |
| Row title | `title` — first service only. Smaller `+N more` from `extraCount` when `extraCount > 0` |
| Row subtitle | `Customer · how they paid`. Method only when the name is missing |
| Payout | Title `Payout` + `statusLabel` (`Arrived`). Same two-line row. `subtitle` is empty |
| Day label | `dateLabel` (grouped; painted as-is) |
| Status | `statusLabel` only when it is not `Paid` |
| Amount | `amountLabel` — color from `tone` |

| Field | Rule |
| ----- | ---- |
| `title` | First service name only. Payouts: `Payout`. Walk-up notes stay the note. |
| `extraCount` | Extra jobs after the first (`2` jobs → `1`). `0` when one job, walk-up, membership, or payout. |
| `subtitle` | `Customer · how they paid`. No card digits. Payouts: `""`. |
| `methodLabel` | How they paid (`Tap to pay`, `Payment link`, `Cash`, `Card`). Not Visa / last four. |
| `statusLabel` | `Paid` / `Arrived` / `Refunded` / `On the way` / `Pending`. |
| `bookingId` | When the row is tied to a booking. |
| `serviceName` | Same as `title` for a job. `null` otherwise. |
| `jobCount` | `extraCount + 1` for a booking job. `0` for payout / walk-up without a booking. |

Server will not send `Mixed jobs` / `Double jobs`, pricing tiers, or card last-four. Mobile still ignores those if they appear.

## Mobile files

| Path | Role |
| ---- | ---- |
| `api/fetchPaymentsTransactions.js` | GET + error map |
| `utils/parsePaymentsTransactions.js` | Defensive parse |
| `hooks/usePaymentsTransactions.js` | Infinite pages (`startingAfter` = opaque `nextCursor`) |
| `components/PaymentsTransactionsSection.jsx` | Header + list |

## What mobile must not do

- Call Stripe
- Send `businessId`
- Re-format `amountLabel`
- Parse `nextCursor` — send it back as `startingAfter`
- Expect `cardLast4`, `bankLast4`, or card digits in labels
- Paint `Mixed jobs` / `Double jobs`

```bash
npx jest src/features/payments/__tests__/fetchPaymentsTransactions.test.js \
  src/features/payments/__tests__/parsePaymentsTransactions.test.js \
  src/features/payments/__tests__/groupPaymentsTransactionsByDate.test.js \
  src/features/payments/__tests__/splitPaymentsTransactionTitle.test.js \
  src/features/payments/__tests__/stripPaymentsCardDetails.test.js \
  src/features/payments/__tests__/presentPaymentsTransactionRow.test.js \
  src/features/payments/__tests__/transactionNeedsBookingLabel.test.js \
  src/features/payments/__tests__/fetchTransactionBookingLabels.test.js \
  src/features/payments/__tests__/PaymentsTransactionsSection.test.jsx \
  src/features/payments/__tests__/PaymentsScreen.test.jsx \
  --no-coverage
```

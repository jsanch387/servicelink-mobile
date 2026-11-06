# Payment flow

How an owner collects money on a visit, and where each number lives. This is the reference for tips, fees, discounts, Tap to Pay, and mark-as-paid.

Related docs: [Tap to Pay SDK](./MOBILE_BOOKING_TAP_TO_PAY.md), [job_completed](./MOBILE_BOOKING_JOB_COMPLETED.md), [lifecycle](./MOBILE_APPOINTMENT_LIFECYCLE.md).

## What the owner does

1. Open **Complete** on the appointment. The Payment sheet opens.
2. The hero is **Amount due**. That number is before the tip.
3. Optional: **Fee or discount**. Add as many as needed. A fee raises the amount due. A discount lowers it. Adding or removing one clears any in-progress tap, so the next charge uses the new list.
4. Collect the balance:
   - **Tap to Pay** — tip sheet first (15%, 20%, 25%, custom, or no tip), then the card tap.
   - **Mark as paid** — cash, payment app, or other. No tip.
5. After a card succeeds, the app sends `job_completed`. The visit is completed only then. Creating a PaymentIntent does not mark the visit paid.

Apple’s Tap to Pay screen has no tip buttons. The customer picks the tip in our sheet before the tap.

## Amount due

Cents, before the tip:

```
booked services
+ booked add-ons
+ stored tax
− booked discount          (bookings.discount_cents)
+ visit fees
− visit discounts
− already paid in the app  (booking_payments.paid_online_amount_cents)
```

A percent tip is `round(amountDue × rate / 100)` on that number. The tip is not taxed, and tax is never recalculated here. The booked service price is never edited from this sheet.

The card is charged:

```
PaymentIntent amount = amount due + tip
```

No tip means the PaymentIntent is the amount due alone.

Worked example (the discount test): Exterior Wash $85.00, deposit discount $50.00, amount due $35.00, 15% tip $5.25, Stripe **$40.25** (`4025`).

## Two kinds of “deposit”

| What the owner means                                       | What it is                                        | Where it lives                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Customer already paid a deposit in the app                 | Money collected online                            | `paid_online_amount_cents`. The sheet labels a partial payment **Deposit paid**.          |
| Cash, Zelle, Cash App, or a courtesy taken off at the door | A visit discount the owner names, often “Deposit” | A `booking_session_fee_lines` row with `kind = discount`. Not `paid_online_amount_cents`. |

A booked sale or promo (`discount_cents` / `discount_label`) is separate from a visit discount. Completing the visit does not change the booked discount.

## What we send

### Tap to Pay intent

`POST /api/availability/bookings/{id}/tap-to-pay/intent`

```json
{
  "sessionFees": [{ "kind": "discount", "label": "Deposit", "amountCents": 5000 }],
  "tipCents": 525
}
```

`sessionFees` is omitted as an empty list only when there are none; the client always sends the array. `tipCents` is omitted when it is 0. There is no fee row labeled “Tip”.

Each line is `{ kind, label, amountCents }`. `kind` is `fee` or `discount`. `amountCents` is always a positive integer. On the sheet, a discount is stored as a negative dollar amount; the payload flips it to positive cents and sets `kind`.

### job_completed

Sent only after Stripe reports the PaymentIntent **succeeded**. Same `sessionFees` as the intent.

```json
{
  "action": "job_completed",
  "sessionFees": [{ "kind": "discount", "label": "Deposit", "amountCents": 5000 }],
  "sessionPayment": {
    "method": "tap_to_pay",
    "amountCents": 4025,
    "stripePaymentIntentId": "pi_…"
  },
  "tipCents": 525
}
```

`sessionPayment.amountCents` is the amount Stripe charged, so a tap includes the tip. `tipCents` is sent again only when it is greater than 0 and the method is `tap_to_pay`. Cash, payment app, and other never send `tipCents`. Their `sessionPayment.amountCents` is the amount due, because there is no tip.

`tap_to_pay` without a PaymentIntent id is rejected on the phone. The visit is not completed from a created-but-unpaid intent.

## Where the numbers are stored

Nothing in this list is written when the intent is created. Rows are written when `job_completed` succeeds.

### `bookings` — the price that was booked

| Column                             | Meaning                                                        |
| ---------------------------------- | -------------------------------------------------------------- |
| `service_price_cents`              | Booked service price. Not changed at payment time.             |
| `discount_cents`, `discount_label` | Booked sale, promo, or manual discount. Not the door discount. |
| `job_details`, `addon_details`     | Services and add-ons.                                          |
| `status`, `job_status`             | Both become `completed` when the visit is completed.           |

### `booking_payments` — what happened at payment time

| Column                                     | Meaning                                                                                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tax_cents`, `tax_rate_bps`                | Tax stored on the booking. Not recalculated. Not applied to the tip.                                                                                  |
| `paid_online_amount_cents`                 | Already collected in the app, including an in-app deposit.                                                                                            |
| `total_amount_cents`                       | Booked total plus visit fees. Does **not** subtract door discounts and does **not** include the tip. Do not show this as the customer’s final number. |
| `session_fees_total_cents`                 | Sum of visit fees only.                                                                                                                               |
| `session_discounts_total_cents`            | Sum of visit discounts. A $50 discount is `5000`.                                                                                                     |
| `session_payment_method`                   | `tap_to_pay`, `cash`, `payment_app`, or `other`.                                                                                                      |
| `session_payment_amount_cents`             | What was collected at the door. For Tap to Pay this is the card amount, tip included.                                                                 |
| `session_payment_stripe_payment_intent_id` | The succeeded PaymentIntent. Tap to Pay only.                                                                                                         |
| `tip_cents`                                | Customer tip. Tap to Pay only. A $5.25 tip is `525`. Cash stays `0`.                                                                                  |
| `remaining_amount_cents`                   | `0` once the visit is settled.                                                                                                                        |
| `payment_status`                           | Settled visit is paid.                                                                                                                                |

Do not show `session_stripe_fee_cents` anywhere in the product.

Server remaining check:

```
remaining_amount_cents = GREATEST(
  (total_amount_cents - paid_online_amount_cents - session_discounts_total_cents)
    - COALESCE(session_payment_amount_cents, 0),
  0
)
```

### `booking_session_fee_lines` — one row per fee or discount

| Column         | Meaning                                                  |
| -------------- | -------------------------------------------------------- |
| `label`        | What the owner typed. A door deposit is often `Deposit`. |
| `kind`         | `fee` or `discount`.                                     |
| `amount_cents` | Always positive.                                         |
| `sort_order`   | List order.                                              |

Who worked the job stays `bookings.assigned_user_id`. There is no `tip_recipient_user_id`. Tip ownership is payroll, later. One assignee per booking.

## What the phone shows

**While collecting**

- Hero: Amount due (pre-tip).
- One list: services, then **Fees & discounts** (fees, then discounts, then an in-app deposit already paid), then tax if it is stored, then **Total**.
- Total is the pre-tip visit total. The tip is chosen on the next sheet and added to the charge.

**After the card succeeds**

The visit completes and the sheet closes. Booking details can show the saved fee and discount lines. A receipt that leads with the charged amount, with the tip under the total, is the planned layout and is not built yet. Do not show two headlines (“Amount due” and “Charged”) on a finished visit.

**Today’s earnings**

`home/utils/todaysEarnings.js` uses the booked price, subtracts the booked discount and `session_discounts_total_cents`, and adds `session_fees_total_cents`. A completed visit counts as fully collected. The tip is not turned into a fee line.

## How to test

| Where                                               | What happens                                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simulator or Expo Go                                | No card reader. **Charge** creates a real PaymentIntent and shows the amount. The visit stays unpaid. No fee line, discount, or `tip_cents` is saved. An orange **Testing mode** banner is on. |
| Development build, test Stripe key, physical iPhone | Full path. Tap a contactless card. Stripe records a test payment and does not charge the card. On success the app sends `job_completed`, and the discount, tip, and completed visit are saved. |
| Live Stripe key                                     | A real card is charged. Not required to prove the data.                                                                                                                                        |

Start the visit so the job is in progress before the tap. `job_completed` is the complete step of that lifecycle.

`TAP_TO_PAY_DEV_MOCK_COLLECTION` stays off while the Terminal SDK is on. That flag pretends the card succeeded and would send an unpaid intent into `job_completed`.

## Code

| Piece                 | Path                                                               |
| --------------------- | ------------------------------------------------------------------ |
| Payment sheet         | `booking-details/components/BookingCompleteInvoiceDesignSheet.jsx` |
| Fee or discount sheet | `booking-details/components/CompleteVisitAddFeeSheet.jsx`          |
| Breakdown list        | `booking-details/components/CompleteVisitBreakdownCard.jsx`        |
| Payload               | `booking-details/utils/buildJobCompletedPayload.js`                |
| Intent body           | `tap-to-pay/api/postTapToPayIntent.js`                             |
| Tip math              | `tap-to-pay/utils/tapToPayTip.js`                                  |
| Lines sent to Stripe  | `tap-to-pay/utils/buildTapToPaySessionFees.js`                     |
| Complete request      | `booking-details/hooks/useMarkBookingCompleteFlow.js`              |
| Earnings              | `home/utils/todaysEarnings.js`                                     |

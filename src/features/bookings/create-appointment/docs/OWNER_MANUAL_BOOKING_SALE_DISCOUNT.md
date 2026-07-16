# Contract addendum: Owner manual booking — auto-apply sale

Mobile create-appointment now **previews** an active marketing **sale** on the Review step when the appointment date qualifies. Promo codes are **not** used on owner-created appointments.

Server must apply (or re-validate) the sale when inserting the booking so amounts and discount snapshot columns stay correct.

**Parent contract:** [`OWNER_MANUAL_BOOKING_SERVER.md`](./OWNER_MANUAL_BOOKING_SERVER.md)  
**Marketing schema / rules:** web `src/features/marketing/docs/` + mobile marketing feature

---

## Product rules (owner create)

| Rule                   | Detail                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Promo codes**        | Do **not** accept / apply on owner manual booking (`ownerManualBooking: true`).                                                           |
| **Sales**              | If the business has an **`is_active = true`** sale that qualifies for `scheduledDate`, apply it automatically.                            |
| **Date window**        | Sale qualifies when `starts_at`/`ends_at` are null (no limit) **or** `scheduledDate` is within the sale window (inclusive calendar days). |
| **Stacking**           | Never stack. Owner flow = sale only (no promo).                                                                                           |
| **What is discounted** | Service + add-ons subtotal only (same as public book).                                                                                    |

---

## Mobile preview fields

When a sale is previewed on Review, mobile may add these optional fields to `POST /api/public/bookings`. They are preview metadata only: the current server ignores their values and recomputes the qualifying sale and persisted snapshot from server-side data.

| Field            | Type                               | Notes                                                      |
| ---------------- | ---------------------------------- | ---------------------------------------------------------- |
| `discountSource` | `"sale"`                           | Only when a sale applies                                   |
| `discountSaleId` | uuid string                        | `sales.id`                                                 |
| `discountType`   | `"percentage"` \| `"fixed_amount"` | Snapshot                                                   |
| `discountValue`  | number                             | % or dollars (same semantics as `sales.discount_value`)    |
| `subtotalCents`  | number                             | Service + add-ons **before** discount                      |
| `discountCents`  | number                             | Discount amount (≥ 0, ≤ subtotal)                          |
| `discountLabel`  | string                             | e.g. `25% OFF` or `$15 OFF` (UI label; server may rebuild) |

**Important:** `servicePriceCents` and `selectedAddOns[].priceCents` remain **gross** (pre-discount). Do not treat them as already reduced.

Mobile UI total = `subtotalCents - discountCents`. The submitted service and add-on cents remain gross; the server is the final source of truth.

---

## Server behavior

### 1. Resolve the sale (source of truth)

On `ownerManualBooking: true`:

1. Load the owner’s business sales (same business as `businessId`).
2. Find the sale that should apply for `scheduledDate`:
   - Prefer `is_active = true`
   - Appointment date in window (or open-ended sale with null dates)
3. Ignore client preview discount fields and recompute from DB.

### 2. Persist booking discount snapshot

When a sale applies, set on `bookings` (same columns as public book):

| Column                   | Value                             |
| ------------------------ | --------------------------------- |
| `discount_source`        | `'sale'`                          |
| `discount_sale_id`       | sale id                           |
| `discount_promo_code_id` | null                              |
| `discount_type`          | sale’s type                       |
| `discount_value`         | sale’s value                      |
| `subtotal_cents`         | service + add-ons pre-discount    |
| `discount_cents`         | computed discount                 |
| `discount_label`         | e.g. `{sale.name} — {amount} OFF` |

When no sale applies: leave discount columns null / zero per existing conventions.

### 3. Amount due / payments

Downstream amount-due math (complete visit, deposits, etc.) must use the snapshot (`discount_cents` / discounted service+addons basis), consistent with public booking sale application.

### 4. Do not write redemptions for sales

`promo_code_redemptions` is promo-only (on job complete). Sales do not insert redemptions.

---

## Example (sale applied)

```json
{
  "ownerManualBooking": true,
  "businessId": "…",
  "businessSlug": "acme-detail",
  "serviceName": "Full detail",
  "servicePriceCents": 20000,
  "selectedAddOns": [{ "id": "…", "name": "Wax", "priceCents": 3500, "durationMinutes": 30 }],
  "durationMinutes": 150,
  "scheduledDate": "2026-07-20",
  "startTime": "10:00",
  "paymentMethodSelected": "none",
  "serviceLocationType": "mobile",
  "discountSource": "sale",
  "discountSaleId": "sale-uuid",
  "discountType": "percentage",
  "discountValue": 20,
  "subtotalCents": 23500,
  "discountCents": 4700,
  "discountLabel": "20% OFF",
  "customer": {}
}
```

Server stores subtotal `23500`, discount `4700`, and amount due based on net service+addons (`18800`) plus any non-discounted fees per existing rules.

---

## Mobile implementation map

| Concern             | Location                                                     |
| ------------------- | ------------------------------------------------------------ |
| Load sales          | `create-appointment/hooks/useCreateAppointmentServerData.js` |
| Qualify + math      | `create-appointment/utils/applyOwnerBookingSale.js`          |
| Review line item    | `create-appointment/steps/ReviewStep.jsx`                    |
| Request body fields | `create-appointment/utils/buildOwnerBookingPayload.js`       |

---

## Checklist for web / API

- [ ] `POST /api/public/bookings` with `ownerManualBooking: true` resolves active sale from `scheduledDate`
- [ ] Persists discount snapshot columns on `bookings`
- [ ] Keeps `servicePriceCents` / add-on cents as gross; does not double-apply client discount
- [ ] Rejects / ignores promo fields on owner manual path
- [ ] Amount-due / complete-job paths honor sale snapshot

# Contract addendum: Owner manual booking — opt-in sale discount

Mobile create-appointment **offers** an active marketing **sale** on the Review step when the appointment date qualifies. The owner must **check “Apply …”** to include the discount. Promo codes are **not** used on owner-created appointments.

Server must honor the opt-in flag when inserting the booking so amounts and discount snapshot columns stay correct.

**Parent contract:** [`OWNER_MANUAL_BOOKING_SERVER.md`](./OWNER_MANUAL_BOOKING_SERVER.md)  
**Marketing schema / rules:** web `src/features/marketing/docs/` + mobile marketing feature

---

## Product rules (owner create)

| Rule                   | Detail                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Promo codes**        | Do **not** accept / apply on owner manual booking (`ownerManualBooking: true`).                                                           |
| **Sales**              | If the business has an **`is_active = true`** sale that qualifies for `scheduledDate`, **offer** it on Review. Do **not** auto-apply.     |
| **Owner opt-in**       | Discount applies only when the owner checks **Apply {discountLabel}** (e.g. `Apply 20% OFF`). Default is **unchecked**.                   |
| **Date window**        | Sale qualifies when `starts_at`/`ends_at` are null (no limit) **or** `scheduledDate` is within the sale window (inclusive calendar days). |
| **Stacking**           | Never stack. Owner flow = sale only (no promo).                                                                                           |
| **What is discounted** | Service + add-ons subtotal only (same as public book).                                                                                    |

---

## Mobile preview / opt-in fields

When a qualifying sale exists for `scheduledDate`, mobile always sends `applySaleDiscount` at the **appointment** level (not per job). Preview snapshot fields are sent **only when opted in**.

| Field               | Type                               | Notes                                                               |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| `applySaleDiscount` | boolean                            | **Required when a sale qualifies.** `true` = apply; `false` = skip. |
| `discountSource`    | `"sale"`                           | Only when `applySaleDiscount === true`                              |
| `discountSaleId`    | uuid string                        | `sales.id`                                                          |
| `discountType`      | `"percentage"` \| `"fixed_amount"` | Snapshot                                                            |
| `discountValue`     | number                             | % or dollars (same semantics as `sales.discount_value`)             |
| `subtotalCents`     | number                             | Service + add-ons **before** discount                               |
| `discountCents`     | number                             | Discount amount (≥ 0, ≤ subtotal)                                   |
| `discountLabel`     | string                             | e.g. `25% OFF` or `$15 OFF` (UI label; server may rebuild)          |

**Important:** `servicePriceCents` and `selectedAddOns[].priceCents` remain **gross** (pre-discount). Do not treat them as already reduced.

Mobile UI total = full subtotal when unchecked; `subtotalCents - discountCents` when checked. The submitted service and add-on cents remain gross; the server is the final source of truth **when applying**.

---

## Server behavior

### 1. Resolve whether to apply (source of truth)

On `ownerManualBooking: true`:

1. Load the owner’s business sales (same business as `businessId`).
2. Find the sale that would qualify for `scheduledDate`:
   - Prefer `is_active = true`
   - Appointment date in window (or open-ended sale with null dates)
3. **Apply the sale only when `applySaleDiscount === true`.**
4. When `applySaleDiscount === false` (or omitted / not `true`): **do not** apply any sale — leave discount columns null / zero even if a sale would have qualified.
5. When applying, ignore client preview amounts if needed and recompute discount from DB + appointment subtotal; still require opt-in.

### 2. Persist booking discount snapshot

When `applySaleDiscount === true` and a sale qualifies, set on `bookings` (same columns as public book):

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

When opted out or no qualifying sale: leave discount columns null / zero per existing conventions.

### 3. Amount due / payments

Downstream amount-due math (complete visit, deposits, etc.) must use the snapshot (`discount_cents` / discounted service+addons basis), consistent with public booking sale application.

### 4. Do not write redemptions for sales

`promo_code_redemptions` is promo-only (on job complete). Sales do not insert redemptions.

---

## Example (sale opted in)

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
  "applySaleDiscount": true,
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

## Example (sale available, owner opted out)

```json
{
  "ownerManualBooking": true,
  "applySaleDiscount": false,
  "scheduledDate": "2026-07-20",
  "jobs": []
}
```

Server must **not** persist a sale discount.

---

## Mobile implementation map

| Concern                  | Location                                                     |
| ------------------------ | ------------------------------------------------------------ |
| Load sales               | `create-appointment/hooks/useCreateAppointmentServerData.js` |
| Qualify + math           | `create-appointment/utils/applyOwnerBookingSale.js`          |
| Opt-in state             | `create-appointment/hooks/useCreateAppointmentController.js` |
| Review checkbox + totals | `create-appointment/steps/ReviewStep.jsx`                    |
| Request body fields      | `create-appointment/utils/buildOwnerBookingPayload.js`       |

---

## Checklist for web / API

- [ ] `POST /api/public/bookings` with `ownerManualBooking: true` applies sale **only** when `applySaleDiscount === true`
- [ ] When `applySaleDiscount === false` / omitted, no sale discount is persisted even if date qualifies
- [ ] Persists discount snapshot columns on `bookings` when opted in
- [ ] Keeps `servicePriceCents` / add-on cents as gross; does not double-apply client discount
- [ ] Rejects / ignores promo fields on owner manual path
- [ ] Amount-due / complete-job paths honor sale snapshot

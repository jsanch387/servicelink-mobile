# Contract: Mobile — Owner creates availability booking (manual)

Use this when the **signed-in business owner** books an appointment **on behalf of a customer** from the native app. Mobile supports a catalog service or custom job and mirrors the web owner flow. The server inserts the booking and payment summary, records `booking_source = 'owner'`, sends owner notifications, and sends the customer confirmation email only when an email is present.

**Do not** insert rows directly into Supabase from the app for this flow — you would skip email, `booking_payments`, free-tier enforcement, time-off checks, and owner notifications.

**Server implementation:** `POST /api/public/bookings` in `src/app/api/public/bookings/route.ts` (web repo)  
**Request type (reference):** `CreateBookingRequest` in `src/features/availability/booking/types.ts`  
**Customer validation:** `bookingCustomerPayloadErrorMessage` / `normalizeBookingCustomerInput` in `src/features/availability/booking/utils/bookingCustomerFieldLimits.ts`

## Mobile implementation map

| Concern                                 | Location (this repo)                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| HTTP client + error mapping             | `create-appointment/api/postOwnerManualPublicBooking.js`                                                  |
| Wizard state → JSON body                | `create-appointment/utils/buildOwnerBookingPayload.js`                                                    |
| `serviceLocationType` + shop/mobile UX  | `create-appointment/utils/createAppointmentServiceLocation.js`, `hooks/useCreateAppointmentController.js` |
| 12h slot → API `startTime`              | `create-appointment/utils/ownerBookingFieldFormats.js`                                                    |
| Bearer JWT                              | `CreateAppointmentFlow.jsx` → `session.access_token`                                                      |
| Auto-apply **sale** on Review + payload | See [`OWNER_MANUAL_BOOKING_SALE_DISCOUNT.md`](./OWNER_MANUAL_BOOKING_SALE_DISCOUNT.md)                    |

**Mobile sends:** top-level `serviceLocationType` (`"mobile"` \| `"shop"`). Does **not** send `customerServiceLocation` (web alias).

### Required mobile branches

- **From services:** send catalog `serviceId`, service name, selected option label/price, selected add-on snapshots, and total duration including add-on time.
- **Custom job:** omit `serviceId`, `servicePriceOptionLabel`, and `selectedAddOns`; send owner-entered name, positive price, duration, and optional notes through `customer.notes`.
- Both branches require an owner-selected schedule, customer name/phone, location, and an empty-or-complete optional vehicle.

---

## Endpoint

|                     |                                           |
| ------------------- | ----------------------------------------- |
| **Method**          | `POST`                                    |
| **Path**            | `/api/public/bookings`                    |
| **Example (local)** | `https://<your-host>/api/public/bookings` |

Use `EXPO_PUBLIC_WEB_APP_URL` / `resolveStripeMobileCheckoutOrigin()` in release builds (HTTPS required in production).

---

## Authentication (required for owner flow)

| Header          | Value                                             |
| --------------- | ------------------------------------------------- |
| `Authorization` | `Bearer <Supabase session access_token>`          |
| `Content-Type`  | `application/json`                                |
| `X-Request-ID`  | Optional; mobile sends a UUID for support tracing |

When `ownerManualBooking` is `true`, the server requires auth. Authenticated user must own `businessId` → mismatch **403**.

---

## Request body (JSON)

Set **`ownerManualBooking`** to **`true`**.

### Top-level fields

| Field                     | Type    | Required | Notes                                                                                                  |
| ------------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `businessSlug`            | string  | Yes      | Must match business public slug.                                                                       |
| `businessId`              | string  | Yes      | UUID `business_profiles.id`; must match slug + owner.                                                  |
| `serviceName`             | string  | Yes      | Base service name.                                                                                     |
| `serviceId`               | string  | Catalog  | Required for catalog; omit for custom.                                                                 |
| `servicePriceOptionLabel` | string  | No       | Selected real catalog option label; omit for base pricing and custom jobs.                             |
| `servicePriceCents`       | number  | Yes      | Gross base/option/custom price in integer cents. Server accepts `0`; mobile custom jobs require `> 0`. |
| `selectedAddOns`          | array   | No       | `{ id, name, priceCents, durationMinutes? }`.                                                          |
| `durationMinutes`         | number  | Yes      | Total length (service + add-ons). Integer ≥ 1.                                                         |
| `scheduledDate`           | string  | Yes      | `YYYY-MM-DD`.                                                                                          |
| `startTime`               | string  | Yes      | 24h `H:mm` or `HH:mm`.                                                                                 |
| `customer`                | object  | Yes      | See below.                                                                                             |
| `paymentMethodSelected`   | string  | No       | Send **`"none"`** for owner manual booking.                                                            |
| `ownerManualBooking`      | boolean | Yes      | Must be **`true`**.                                                                                    |
| `serviceLocationType`     | string  | Yes\*    | **`"mobile"`** or **`"shop"`**. New mobile always sends this.                                          |
| `customerServiceLocation` | string  | No       | Web alias — **mobile does not send**; `serviceLocationType` wins if both present.                      |

\*Mobile always sends this. The server may infer single-mode businesses, but a `both` business receives `400` when omitted.

### `serviceLocationType` rules

| Value      | Meaning                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `"mobile"` | Owner travels to customer. `customer.*` address = service address (entered in app).                                                  |
| `"shop"`   | Customer visits shop. `customer.*` address = business shop address (from `business_profiles`; app pre-fills, no address step in UI). |

**Server validation:**

- Must be `"mobile"` or `"shop"` when sent.
- `"shop"` rejected if `service_location_mode` is `mobile_only`.
- `"mobile"` rejected if `service_location_mode` is `shop_only`.
- For `both`, either allowed.

**Persistence:** the route resolves and stores a concrete `mobile` or `shop` value in `bookings.service_location_type`.

### Customer object

All keys are **strings** in JSON.

| Field                                        | Required    | Notes                                                   |
| -------------------------------------------- | ----------- | ------------------------------------------------------- |
| `fullName`                                   | Yes         | Max 120 chars.                                          |
| `email`                                      | No          | Empty → no confirmation email.                          |
| `phone`                                      | Yes         | 10-digit NANP in mobile payload.                        |
| `streetAddress`                              | Conditional | Required for mobile; max 200 chars.                     |
| `unitApt`                                    | No          | Max 50 chars for mobile.                                |
| `city`                                       | Conditional | Required for mobile; max 100 chars.                     |
| `state`                                      | Conditional | Required for mobile; 2-letter uppercase.                |
| `zip`                                        | Conditional | Required for mobile; exactly 5 US digits.               |
| `vehicleYear`, `vehicleMake`, `vehicleModel` | Conditional | All empty, or all set; year is 1900 … current year + 1. |
| `notes`                                      | No          | Max 280 chars; stored in `customer_notes`.              |

### Example (minimal owner booking)

```json
{
  "businessSlug": "acme-detail",
  "businessId": "uuid-of-business_profiles-row",
  "serviceName": "Full detail",
  "servicePriceCents": 15000,
  "durationMinutes": 120,
  "scheduledDate": "2026-05-20",
  "startTime": "10:00",
  "paymentMethodSelected": "none",
  "ownerManualBooking": true,
  "serviceLocationType": "mobile",
  "customer": {
    "fullName": "Jordan Lee",
    "email": "jordan@example.com",
    "phone": "5551234567",
    "streetAddress": "123 Main St",
    "unitApt": "",
    "city": "Austin",
    "state": "TX",
    "zip": "78701",
    "vehicleYear": "",
    "vehicleMake": "",
    "vehicleModel": "",
    "notes": ""
  }
}
```

---

## Success response

**HTTP:** `201 Created` — `{ "success": true, "data": { "id": "<uuid>" } }`  
Header **`X-Request-ID`** for support.

**Server side effects:** `bookings` (+ `service_location_type`), `booking_payments`, owner notification/push, customer email if `customer.email` set.

---

## Error responses

`{ "success": false, "error": "<message>" }`

| HTTP  | Typical cause                                                |
| ----- | ------------------------------------------------------------ |
| `400` | Invalid fields, slug/id mismatch, bad `serviceLocationType`. |
| `401` | Missing/invalid Bearer.                                      |
| `403` | Not business owner or free-tier cap.                         |
| `404` | Unknown slug / not public.                                   |
| `409` | Time-off conflict.                                           |
| `500` | Server failure.                                              |

Mobile maps these in `mapOwnerManualBookingHttpError` (`postOwnerManualPublicBooking.js`).

### Scheduling and retries

- Mobile refreshes availability and blocking bookings immediately before the final POST.
- If the selected slot disappeared, it returns the owner to Date and time and clears the stale time.
- Submit is disabled while refresh/submission is active.
- Requests are not automatically retried after ambiguous network failures because the endpoint has no idempotency key.
- The server rejects configured time-off overlap (`409`) but does not transactionally prevent simultaneous booking overlap.

---

## Public customer self-serve

Same path without `ownerManualBooking: true` and without Bearer — **not** this contract. Owner mobile **always** sends `ownerManualBooking: true` + Bearer.

---

## Related server code (web repo)

| Piece                    | Location                                                                       |
| ------------------------ | ------------------------------------------------------------------------------ |
| Route handler            | `src/app/api/public/bookings/route.ts`                                         |
| Service location persist | `src/features/availability/booking/utils/resolveBookingServiceLocationType.ts` |
| Booking insert           | `src/features/availability/services/bookingService.ts` → `createBooking`       |

# Contract: Mobile — Owner creates availability booking (manual)

Use this when the **signed-in business owner** books an appointment **on behalf of a customer** from the native app. The server runs the **same** handler as the web dashboard flow (`/[slug]/book?for=owner`): it inserts the booking, payment summary row, owner notification + Expo push, and (when present) **sends the customer confirmation email**.

**Do not** insert rows directly into Supabase from the app for this flow — you would skip email, `booking_payments`, free-tier enforcement, time-off checks, and owner notifications.

**Server implementation:** `POST /api/public/bookings` in `src/app/api/public/bookings/route.ts` (web repo)  
**Request type (reference):** `CreateBookingRequest` in `src/features/availability/booking/types.ts`  
**Customer validation:** `bookingCustomerPayloadErrorMessage` / `normalizeBookingCustomerInput` in `src/features/availability/booking/utils/bookingCustomerFieldLimits.ts`

## Mobile implementation map

| Concern                                | Location (this repo)                                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| HTTP client + error mapping            | `create-appointment/api/postOwnerManualPublicBooking.js`                                                  |
| Wizard state → JSON body               | `create-appointment/utils/buildOwnerBookingPayload.js`                                                    |
| `serviceLocationType` + shop/mobile UX | `create-appointment/utils/createAppointmentServiceLocation.js`, `hooks/useCreateAppointmentController.js` |
| 12h slot → API `startTime`             | `create-appointment/utils/ownerBookingFieldFormats.js`                                                    |
| Bearer JWT                             | `CreateAppointmentFlow.jsx` → `session.access_token`                                                      |

**Mobile sends:** top-level `serviceLocationType` (`"mobile"` \| `"shop"`). Does **not** send `customerServiceLocation` (web alias).

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

| Field                     | Type    | Required | Notes                                                                             |
| ------------------------- | ------- | -------- | --------------------------------------------------------------------------------- |
| `businessSlug`            | string  | Yes      | Must match business public slug.                                                  |
| `businessId`              | string  | Yes      | UUID `business_profiles.id`; must match slug + owner.                             |
| `serviceName`             | string  | Yes      | Base service name.                                                                |
| `serviceId`               | string  | No       | Optional service id.                                                              |
| `servicePriceOptionLabel` | string  | No       | Non-`Standard` tier label.                                                        |
| `servicePriceCents`       | number  | No       | Omit or `0` when free.                                                            |
| `selectedAddOns`          | array   | No       | `{ id, name, priceCents, durationMinutes? }`.                                     |
| `durationMinutes`         | number  | Yes      | Total length (service + add-ons). Integer ≥ 1.                                    |
| `scheduledDate`           | string  | Yes      | `YYYY-MM-DD`.                                                                     |
| `startTime`               | string  | Yes      | 24h `H:mm` or `HH:mm`.                                                            |
| `customer`                | object  | Yes      | See below.                                                                        |
| `paymentMethodSelected`   | string  | No       | Send **`"none"`** for owner manual booking.                                       |
| `ownerManualBooking`      | boolean | Yes      | Must be **`true`**.                                                               |
| `serviceLocationType`     | string  | Yes\*    | **`"mobile"`** or **`"shop"`**. New mobile always sends this.                     |
| `customerServiceLocation` | string  | No       | Web alias — **mobile does not send**; `serviceLocationType` wins if both present. |

\*Older mobile builds may omit → server stores `NULL` on `bookings.service_location_type`.

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

**Persistence:** `bookings.service_location_type` (`text`, nullable).

### Customer object

All keys are **strings** in JSON.

| Field                                        | Required    | Notes                            |
| -------------------------------------------- | ----------- | -------------------------------- |
| `fullName`                                   | Yes         | Max 120 chars.                   |
| `email`                                      | No          | Empty → no confirmation email.   |
| `phone`                                      | Yes         | 10-digit NANP in mobile payload. |
| `streetAddress`                              | Yes         | Max 200 chars.                   |
| `unitApt`                                    | No          | Max 50 chars.                    |
| `city`                                       | Yes         | Max 100 chars.                   |
| `state`                                      | Yes         | 2-letter uppercase.              |
| `zip`                                        | Yes         | US 5 or 9 digits (server).       |
| `vehicleYear`, `vehicleMake`, `vehicleModel` | Conditional | All three if any set.            |
| `notes`                                      | No          |                                  |

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

# Owner manual booking — server API (mobile)

When a **signed-in business owner** completes **Create appointment** from the app (home FAB → wizard → Confirm), the client **must not** insert rows directly into Supabase. Instead it calls the Next.js route that runs the **same pipeline** as the web dashboard owner flow (`/[slug]/book?for=owner`).

That server path creates the `bookings` row, `booking_payments` for the no-checkout path, owner notifications / Expo push, enforces free-tier caps and time-off, and sends the **customer confirmation email** when `customer.email` is non-empty.

## Endpoint

| Item     | Value                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Method   | `POST`                                                                                                         |
| Path     | `/api/public/bookings`                                                                                         |
| Full URL | `{webAppOrigin}/api/public/bookings` — see `resolveStripeMobileCheckoutOrigin()` and `EXPO_PUBLIC_WEB_APP_URL` |

## Mobile implementation map

| Concern                                    | Location                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| HTTP client + error mapping                | `create-appointment/api/postOwnerManualPublicBooking.js`                                     |
| Wizard state → JSON body                   | `create-appointment/utils/buildOwnerBookingPayload.js` (`buildOwnerManualPublicBookingBody`) |
| 12h slot label → API `startTime` (`HH:mm`) | `create-appointment/utils/ownerBookingFieldFormats.js` (`startTime12hToApiStartTime`)        |
| Phone digits for `customer.phone`          | `ownerBookingFieldFormats.js` (`bookingCustomerPhoneDigits`)                                 |
| Confirm mutation + cache invalidation      | `create-appointment/hooks/useCreateAppointmentController.js`                                 |
| Supabase JWT on the wire                   | `CreateAppointmentFlow.jsx` passes `session.access_token` into the controller                |

## Request contract (summary)

- **`ownerManualBooking`:** always `true` for this flow.
- **`Authorization`:** `Bearer <Supabase session access_token>` (required).
- **Top-level:** `businessSlug`, `businessId`, `serviceName` (base name only), optional `serviceId`, optional `servicePriceOptionLabel` when the tier is not `Standard`, `servicePriceCents`, `selectedAddOns`, `durationMinutes`, `scheduledDate` (`YYYY-MM-DD`), `startTime` (24h `HH:mm`), `paymentMethodSelected: "none"`, `customer` (all string fields per server validation).
- **`customer`:** mirrors `CreateBookingRequest` / `bookingCustomerFieldLimits` on the server; empty `email` means **no** confirmation email.

The authoritative contract lives with the web app (`src/app/api/public/bookings/route.ts`, `CreateBookingRequest` in `src/features/availability/booking/types.ts`). This document describes how **mobile** satisfies that contract.

## Success and caching

- **HTTP 201** with `{ success: true, data: { id } }` — response may include `X-Request-ID` for support.
- On success, `useCreateAppointmentController` calls `invalidateBookingCachesAfterMutation` (bookings queries + home + new booking details) and invalidates the customers list query so CRM cards stay in sync.

## Errors

`postOwnerManualPublicBooking` maps status codes to short user-facing messages (`mapOwnerManualBookingHttpError`). The server `error` string is preferred when present (`400`, `403`, etc.).

## Production HTTPS

Non-dev builds require `EXPO_PUBLIC_WEB_APP_URL` to use `https://` (`productionWebApiHttpsGuard` in `src/lib/productionWebApiHttpsGuard.js`). This guard is shared with other mobile → Next.js clients (e.g. quotes).

## Removed client-only path

Previous versions upserted `customers` and inserted `bookings` via Supabase from `insertOwnerBooking` / `upsertCustomerForBooking`. That skipped server-side email and policy checks and has been **removed** in favor of this API.

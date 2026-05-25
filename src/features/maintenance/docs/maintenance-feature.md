# Maintenance feature (mobile)

How maintenance enrollments work in the ServiceLink mobile app: navigation, data sources, auth, status rules, and contracts with Supabase and the Next.js web API.

## Overview

Owners use maintenance to:

1. **Send** a maintenance service link from a customer profile (wizard: plan → optional schedule → review → send).
2. **Track** enrollments in **More → Maintenance details** with three tabs: **Pending**, **Confirmed**, **Completed**.
3. **Open detail** for one enrollment (service, schedule, payment, customer, copy link, remove if still pending).
4. Rely on the **linked booking** as source of truth when a visit is marked complete.

Customer-facing pay/confirm happens on the **web** via the public link — not in this app.

## Configuration

| Variable                                                     | Role                                                                                                                                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_WEB_APP_URL`                                    | Origin for `POST /api/maintenance/enrollments` and invite links (`{origin}/maintenance/e/{token}`). Production sends require **https** (`productionWebApiHttpsGuard`). |
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase reads (inbox, detail, schedule, delete). User JWT is attached automatically by the Supabase client.                                                           |

Business profile (from `fetchBusinessProfileForUser`): requires `id`, **`business_slug`** before send.

## Navigation (central routes)

Import from `src/routes/routes.js` — do not hardcode screen names.

| Constant                    | Stack     | Screen                                                   |
| --------------------------- | --------- | -------------------------------------------------------- |
| `ROUTES.MAINTENANCE_INVITE` | Customers | Send wizard                                              |
| `ROUTES.MAINTENANCE`        | More      | Inbox list                                               |
| `ROUTES.MAINTENANCE_DETAIL` | More      | Single enrollment                                        |
| `ROUTES.CUSTOMER_DETAILS`   | More      | Customer profile (from detail; same stack for safe area) |

**Send success → detail:** wizard calls `navigation.navigate(ROUTES.MORE, { screen: ROUTES.MAINTENANCE_DETAIL, params: { customerId, enrollmentId } })`.

## Feature layout

```
src/features/maintenance/           — inbox, detail, Supabase reads, presentation
src/features/customers/maintenance-invite/  — send wizard, schedule hook, POST send API
```

## Data sources

### 1. Web API — send enrollment

Module: `src/features/customers/maintenance-invite/api/postMaintenanceEnrollment.js`

| Operation              | Method | Path                                   | Auth                                  | Success                   |
| ---------------------- | ------ | -------------------------------------- | ------------------------------------- | ------------------------- |
| Send maintenance offer | `POST` | `{origin}/api/maintenance/enrollments` | `Authorization: Bearer <accessToken>` | **201** + `success: true` |

Also sends client **`X-Request-ID`**. Mobile blocks send when `accessToken` is missing.

Payload built by `buildMaintenanceInvitePayload` — requires `businessId`, `businessSlug`, `customerId`, `priceCents`, `durationMinutes`; optional `anchorDate` + `anchorTime` when owner suggests a slot.

### 2. Supabase — enrollments (inbox & detail)

Module: `src/features/maintenance/api/fetchMaintenanceEnrollmentsSupabase.js`

- **`fetchMaintenanceEnrollmentsByBusiness(businessId)`** — all rows for business, newest first (one inbox row per enrollment, not per customer).
- **`fetchMaintenanceEnrollmentById(businessId, customerId, enrollmentId)`** — single row for detail.

Selected columns include: `status`, `payment_status`, `customer_selected_payment`, `price_cents`, `duration_minutes`, `anchor_date`, `anchor_time`, `customer_invite_token`, `initial_booking_id`, `created_at`.

**Delete (pending only):** `deleteMaintenanceEnrollmentForBusiness` — Supabase delete with `.eq('status', 'enrolled_pending_customer')`. Requires owner **DELETE** RLS.

### 3. Supabase — linked booking status (completed tab)

Module: `src/features/maintenance/api/fetchLinkedBookingStatuses.js`

After loading enrollments, mobile batch-reads `bookings.id, status` for all `initial_booking_id` values and attaches **`linkedBookingStatus`** on each enrollment summary.

If booking read fails, maintenance list still loads (enrichment is best-effort).

### 4. Supabase — schedule step (wizard)

Module: `src/features/customers/maintenance-invite/hooks/useMaintenanceInviteSchedule.js`

Same rules as new appointment:

- `fetchBusinessAvailability(businessId)` → `business_availability`
- `fetchBlockingBookingsInRange(businessId, from, to)` → `bookings` (blocking slots only)

Uses shared **`supabase`** client — user's session JWT is sent automatically; authorization is **RLS**, not a separate Bearer call to Next.js.

## Enrollment status (mobile UI)

DB `maintenance_enrollments.status` (CHECK): `enrolled_pending_customer` | `accepted` | `cancelled` (no `visit_completed` in DB today).

| UI label      | Rule                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------- |
| **Pending**   | `status === enrolled_pending_customer`                                                             |
| **Confirmed** | `status === accepted` and linked booking is **not** `completed`                                    |
| **Completed** | `linkedBookingStatus === completed` on `initial_booking_id` (enrollment may stay `accepted` in DB) |

Legacy: if DB ever adds `visit_completed`, mobile treats it as completed too.

**Inbox tabs** — `partitionMaintenanceInbox` in `maintenancePresentation.js`:

- `pending` / `confirmed` / `completed` — mutually exclusive; completed does not appear on Confirmed.

**Status pills**

- Pending: orange
- Confirmed: green
- Completed: blue (matches bookings)

Payment details appear on **detail only** (`buildMaintenancePaymentSection`), not list pills.

## Booking = source of truth for “complete”

When owner marks a booking **completed** (`markBookingCompletedById`), mobile does **not** update `maintenance_enrollments`. Detail/list refresh via `MAINTENANCE_QUERY_ROOT` invalidation; UI reads `bookings.status` through `initial_booking_id`.

Mark complete from **Home** or **Booking detail** — same invalidation path.

## Schedule UX notes

- Optional date/time on send; customer can choose from link if skipped.
- `maintenanceScheduleUtils` hides server-default anchor (create-day + 10:00) when owner skipped schedule.
- Calendar only shows open days/times from availability + existing bookings.

## React Query keys

`src/features/maintenance/queryKeys.js`:

- `MAINTENANCE_QUERY_ROOT` — invalidate entire maintenance tree
- `maintenanceListQueryKey(businessId)` — inbox
- `maintenanceDetailQueryKey(businessId, customerId, enrollmentId)` — detail

Wizard send invalidates: `MAINTENANCE_QUERY_ROOT`, customer list/detail, after success.

Schedule: `maintenanceInviteScheduleQueryKey(businessId)` (+ availability / blocking suffixes).

## Security summary

| Action                                      | Transport       | Auth                                |
| ------------------------------------------- | --------------- | ----------------------------------- |
| Send offer                                  | HTTPS → Next.js | Explicit `Bearer` JWT               |
| Inbox / detail / delete                     | Supabase        | Auto JWT on `supabase` client + RLS |
| Schedule (availability + blocking bookings) | Supabase        | Auto JWT + RLS                      |
| Linked booking status                       | Supabase        | Auto JWT + RLS                      |

Session storage: encrypted on device (`LargeSecureStore` pattern in `src/lib/supabase.js`).

**Backend must enforce:** RLS on `maintenance_enrollments`, `bookings`, `business_availability`, and JWT validation on `POST /api/maintenance/enrollments`.

## Tests

```bash
npm test -- --testPathPattern="maintenance|MaintenanceInvite|maintenanceEnrollment"
```

Covers: presentation/partitioning, Supabase parsing, linked booking enrichment, payment section, schedule heuristics, delete API, status pills, `MaintenanceScreen`, `MaintenanceDetailScreen`, `MaintenanceEnrollmentCard`, invite payload/guards.

## Known product gaps (optional follow-ups)

- **View booking** from maintenance detail (`initialBookingId` is on the model; no nav row yet).
- Home attention card for pending maintenance.
- Web delete parity for enrollments.
- Server may still **409** on duplicate pending send (mobile allows resending; no client gate).

## Related docs

- Quotes (similar Supabase read + web send pattern): `src/features/quotes/docs/quotes-feature.md`
- Database tables (partial): `DATABASE_SCHEMA_REFERENCE.md` at repo root (bookings; maintenance table not fully documented there yet).

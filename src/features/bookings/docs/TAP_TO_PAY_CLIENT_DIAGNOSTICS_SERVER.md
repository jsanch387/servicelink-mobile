# Server instructions: Tap to Pay client diagnostics (intent debug capture)

**Audience:** Web / API team (or paste this entire doc into your server-side coding agent)  
**Mobile repo:** `servicelink-mobile`  
**Related:** [`MOBILE_BOOKING_TAP_TO_PAY.md`](./MOBILE_BOOKING_TAP_TO_PAY.md), [`TAP_TO_PAY_TERMINAL_SERVER.md`](./TAP_TO_PAY_TERMINAL_SERVER.md)  
**SQL (already applied):** `docs/sql/booking_tap_to_pay_client_diagnostics.sql` (mobile + web mirrors)  
**Status:** **DB columns live** — mobile is ready to POST reports. Server must expose the route below (and deploy it) or nothing lands in the new columns.

---

## Why we need this

Tap to Pay works for some merchants and fails for others. Today `booking_tap_to_pay_intents` only shows Stripe intent status (`requires_payment_method`, `canceled`, `succeeded`). That is **not enough** to root-cause device/SDK failures.

Example production signal we already saw:

- Intent created fine (`pi_…`, amount correct)
- Charge never succeeded
- User-facing error: `No reader is connected. Connect to a reader before trying again.`
- UI wrongly collapsed that to “Tap to Pay not configured”

We need the **phone** to report:

- Which stage failed (`connect` vs `collect` vs `confirm` …)
- Stripe/Terminal **error code + message**
- App version / build, iOS version, device model
- Whether our in-memory reader session thought it was still warm (`readerWarm`)

Mobile **cannot** write these columns with the anon key + RLS (intent writes are service-role). Same pattern as intent create: mobile → Next.js route → admin Supabase update.

---

## Copy-paste prompt (for server agent)

```text
Implement a booking-scoped Tap to Pay client diagnostic event endpoint for ServiceLink mobile.

Context:
- DB columns on public.booking_tap_to_pay_intents are ALREADY migrated (client_stage, client_error_code, client_error_message, client_error_at, client_success_at, client_diagnostics, client_duration_ms, client_report_count).
- Mobile POSTs best-effort reports after Tap to Pay success or failure. Missing route = silent drop (mobile never blocks payment UX on report failure).
- Reuse the same Bearer auth + business resolution as existing booking tap-to-pay routes (resolveTapToPayRouteAuth / getAuthenticatedUser).

Requirements:
1. Add POST /api/availability/bookings/{bookingId}/tap-to-pay/client-event
2. Auth: Authorization: Bearer <supabase access token> (same as …/tap-to-pay/intent)
3. Body JSON (all fields optional except outcome/stage when present — be defensive):
   {
     "outcome": "failure" | "success",
     "stage": "intent" | "connect" | "retrieve" | "collect" | "confirm" | "success" | "unknown",
     "message": "short string",
     "code": "READER_NOT_CONNECTED",
     "paymentIntentId": "pi_…",
     "httpStatus": 500,
     "requestId": "…",
     "durationMs": 1200,
     "diagnostics": {
       "platform": "ios",
       "osVersion": "18.5",
       "appVersion": "1.0.7",
       "appBuild": "42",
       "deviceName": "iPhone15,2",
       "isDevice": true,
       "readerWarm": false,
       "sessionInitialized": true,
       "sessionHasConnectKey": true
     }
   }
4. Resolve signed-in user → business. bookingId in path must belong to that business (same ownership check style as intent route). Prefer matching paymentIntentId to an existing booking_tap_to_pay_intents row for that booking_id + business_id.
5. If paymentIntentId is missing (e.g. intent API failed before PI create): return 200 { success: true, updated: false } after server console.warn — do not 500.
6. If paymentIntentId is present but no matching intent row: return 200 { success: true, updated: false } (intent may have been canceled/orphaned). Still log.
7. On match, UPDATE booking_tap_to_pay_intents:
   - Always: client_stage, client_diagnostics (merge diagnostics + requestId/httpStatus/outcome/reportedAt), client_duration_ms, client_report_count = coalesce(client_report_count,0) + 1
   - outcome=failure: client_error_code, client_error_message, client_error_at = now()
   - outcome=success: client_success_at = now() (do not wipe prior error fields)
8. Cap strings: stage 80, code 120, message 500. Sanitize diagnostics to flat string|number|boolean|null only (no nested objects/arrays).
9. Response 200: { "success": true, "updated": true|false }
10. Errors: { "success": false, "error": "…" } with 401/403/404/500 as appropriate for auth/booking — NOT for “no PI row”
11. Use createSupabaseAdminClient() for the update (service role). Do not rely on user JWT to UPDATE this table.
12. This route must be fast and best-effort. Never create Stripe objects. Never cancel/succeed PaymentIntents here.

Verification:
- After a failed Tap to Pay in a build that calls this route, SELECT client_stage, client_error_code, client_error_message, client_diagnostics FROM booking_tap_to_pay_intents WHERE client_error_at IS NOT NULL ORDER BY client_error_at DESC LIMIT 20;
- After success: client_success_at and client_diagnostics.outcome = 'success'
```

---

## Endpoint contract

### `POST /api/availability/bookings/{bookingId}/tap-to-pay/client-event`

|              |                                                 |
| ------------ | ----------------------------------------------- |
| Auth         | `Authorization: Bearer <supabase access_token>` |
| Content-Type | `application/json`                              |
| Stripe       | None — DB write only                            |

### Request body

| Field             | Type                     | Notes                                                               |
| ----------------- | ------------------------ | ------------------------------------------------------------------- |
| `outcome`         | `'failure' \| 'success'` | Default treat as `failure` if missing/invalid                       |
| `stage`           | string                   | `intent`, `connect`, `retrieve`, `collect`, `confirm`, `success`, … |
| `message`         | string \| null           | Human / mapped error text (capped)                                  |
| `code`            | string \| null           | Stripe Terminal / app code when known                               |
| `paymentIntentId` | string \| null           | `pi_…` — required to update a row                                   |
| `httpStatus`      | number \| null           | From prior API failure (intent create, etc.)                        |
| `requestId`       | string \| null           | Correlation id from intent/token calls                              |
| `durationMs`      | number \| null           | Time spent in the failing/succeeding attempt                        |
| `diagnostics`     | object \| null           | Non-PII device/app context (see below)                              |

### `diagnostics` (expected keys — accept extras if scalar)

| Key                    | Example      | Why                                            |
| ---------------------- | ------------ | ---------------------------------------------- |
| `platform`             | `ios`        | Platform                                       |
| `osVersion`            | `18.5`       | Old iOS vs new                                 |
| `appVersion`           | `1.0.7`      | Marketing version                              |
| `appBuild`             | `42`         | Native build                                   |
| `deviceName`           | `iPhone15,2` | Unsupported device?                            |
| `isDevice`             | `true`       | Simulator vs hardware                          |
| `readerWarm`           | `true/false` | Stale in-memory session vs real SDK disconnect |
| `sessionInitialized`   | bool         | Terminal SDK init flag                         |
| `sessionHasConnectKey` | bool         | We thought a reader was connected              |

**Do not store:** connection tokens, client secrets, card data, customer PII.

### Success response

```json
{ "success": true, "updated": true }
```

or when nothing to update (no PI / no row):

```json
{ "success": true, "updated": false }
```

### Error response

```json
{ "success": false, "error": "Human-readable message" }
```

---

## Database (already migrated — do not re-run unless verifying)

Columns on `public.booking_tap_to_pay_intents`:

| Column                 | Type        | Purpose                                          |
| ---------------------- | ----------- | ------------------------------------------------ |
| `client_stage`         | text        | Last reported stage                              |
| `client_error_code`    | text        | Last failure code                                |
| `client_error_message` | text        | Last failure message                             |
| `client_error_at`      | timestamptz | Last failure report time                         |
| `client_success_at`    | timestamptz | Last success report time                         |
| `client_diagnostics`   | jsonb       | Device/app snapshot + outcome metadata           |
| `client_duration_ms`   | int         | Optional duration                                |
| `client_report_count`  | int         | How many reports applied to this row (default 0) |

Index (optional, already in SQL file):

```sql
create index if not exists idx_booking_tap_to_pay_intents_client_error_at
  on public.booking_tap_to_pay_intents (client_error_at desc nulls last)
  where client_error_at is not null;
```

### Update rules

1. Match row by `stripe_payment_intent_id` + `booking_id` + `business_id` (owner’s business).
2. On **failure**: set error columns + `client_error_at`; refresh diagnostics/stage/duration; bump `client_report_count`.
3. On **success**: set `client_success_at`; refresh diagnostics/stage/duration; bump count; **leave** prior `client_error_*` alone (each Try again usually creates a **new** PI anyway).
4. Never delete or cancel Stripe PaymentIntents from this route.

---

## What mobile already does

Feature: `src/features/tap-to-pay/`

- After intent API failure → `outcome: failure`, `stage: intent` (may have no `paymentIntentId`)
- After Terminal failure → `outcome: failure`, `stage: connect|retrieve|collect|confirm`, with `code` / `message` / `durationMs`
- After Terminal success → `outcome: success`, `stage: success` **before** `job_completed`
- Call is fire-and-forget (`void postTapToPayClientEvent(…)`); UI never waits on it

Client helper: `postTapToPayClientEvent.js` →  
`POST {WEB_APP_ORIGIN}/api/availability/bookings/{bookingId}/tap-to-pay/client-event`

If the route is **404** or down, diagnostics simply never appear in SQL. Intent create / collect still behave as today.

---

## Suggested server layout (web repo)

| Piece         | Path suggestion                                                           |
| ------------- | ------------------------------------------------------------------------- |
| Route         | `src/app/api/availability/bookings/[id]/tap-to-pay/client-event/route.ts` |
| Handler       | `src/features/availability/booking/server/recordTapToPayClientEvent.ts`   |
| Auth          | Reuse `resolveTapToPayRouteAuth` (same as intent / connection-token)      |
| SQL reference | `docs/sql/booking_tap_to_pay_client_diagnostics.sql`                      |

---

## Verification checklist

1. Deploy route to the same origin mobile uses for intent (`myservicelink.app` / staging).
2. `curl` with a real owner Bearer token + known `bookingId` + `paymentIntentId` from an open intent row → `updated: true`.
3. Confirm columns populate:

```sql
select
  stripe_payment_intent_id,
  status,
  client_stage,
  client_error_code,
  client_error_message,
  client_error_at,
  client_success_at,
  client_diagnostics,
  client_duration_ms,
  client_report_count,
  created_at
from public.booking_tap_to_pay_intents
order by coalesce(client_error_at, client_success_at, created_at) desc
limit 30;
```

4. Failures of interest:

```sql
select
  client_stage,
  client_error_code,
  client_error_message,
  client_diagnostics->>'appVersion' as app_version,
  client_diagnostics->>'osVersion' as os_version,
  client_diagnostics->>'deviceName' as device,
  client_diagnostics->>'readerWarm' as reader_warm,
  client_error_at
from public.booking_tap_to_pay_intents
where client_error_at is not null
order by client_error_at desc
limit 50;
```

5. Mobile Metro/device log may show `[TapToPay] client-event.report …` in verbose mode; production still POSTs without needing verbose logs.

---

## Out of scope

- Changing PaymentIntent create / cancel / `job_completed` verification
- Writing diagnostics from mobile straight to Supabase
- Requiring this report for payment success (must stay best-effort)
- Analytics vendors (Amplitude, etc.) — Postgres is the source of truth for now

---

## Success criteria

| Done when                       |                                                                        |
| ------------------------------- | ---------------------------------------------------------------------- |
| Route live on production origin | Mobile POSTs return 200                                                |
| Failed Tap to Pay attempts      | Rows show `client_error_*` + diagnostics                               |
| Successful taps                 | Rows show `client_success_at` + diagnostics                            |
| Ops can answer                  | Stage? Code? App/OS/device? Was `readerWarm` true when collect failed? |

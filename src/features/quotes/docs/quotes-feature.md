# Quotes feature (mobile)

This document describes how the quotes area works in the ServiceLink mobile app: navigation, where data comes from, and the contracts between the app, Supabase, and the Next.js web API.

## Overview

Detailers use **Quotes** to:

1. See **quote requests** — inbound leads where a customer asked for a quote via the public booking link (`source` / `status` rules below).
2. See **sent quotes** — everything else in the owner’s `quotes` rows (drafts, sent links, viewed, approved, etc.).
3. Open a **quote detail** screen for a single row (request vs sent UI is driven by the row, not only deep-link params).
4. **Create / review / send** a quote from the wizard (`CreateQuoteScreen`), which either creates a new quote on the server or sends an existing quote request as a priced quote.

Reads for lists and detail go through **Supabase** (authenticated user, RLS). **Sending** a quote goes through the **web app** HTTP API so the server can enforce business rules, create links, and return the public URL.

## Configuration

| Variable                  | Role                                                                                                                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_WEB_APP_URL` | Origin for quote send (`/api/quotes/...`). In production builds the send client requires **https**. In dev, `resolveStripeMobileCheckoutOrigin()` may fall back to `localhost` / `10.0.2.2` (Android emulator). |

Business profile fields used by quotes (from `fetchBusinessProfileForUser`): `id`, `business_slug`, `accept_quote_req`, etc. The wizard requires a non-empty **`business_slug`** before send.

## Navigation (central routes)

Defined in `src/routes/routes.js` — import `ROUTES` / `PATHS`, do not hardcode names:

| Constant              | Screen / path        |
| --------------------- | -------------------- |
| `ROUTES.QUOTES`       | Quotes inbox         |
| `ROUTES.QUOTE_DETAIL` | Single quote         |
| `ROUTES.CREATE_QUOTE` | Create / send wizard |

## Data feed

### 1. Supabase — `quotes` (owner list & detail)

Module: `src/features/quotes/api/quotes.js`

- **`fetchQuotesForBusiness(businessId)`** — `select` on `quotes` filtered by `business_id`, ordered by `updated_at` descending.
- **`fetchQuoteByIdForBusiness(businessId, quoteId)`** — single row by `id` + `business_id` (`maybeSingle`).
- **`deleteQuoteForBusiness`** — delete by `id` + `business_id` (RLS must allow).

**Column set** (owner list/detail; keep aligned with production `quotes`):

`QUOTE_OWNER_LIST_COLUMNS` in `quotes.js` — includes `scheduled_date`, `scheduled_start_time` (quotes use these, not `start_time` like some booking shapes).

### 2. Supabase — `quote_public_links`

- **`fetchActiveQuoteLinkExpiry(quoteId)`** — latest active row: `is_active = true`, `expires_at` for “good until” on sent-quote detail. Failures are non-fatal (detail still shows; expiry may show as `—`).

### 3. Supabase — `business_profiles`

- **`updateAcceptQuoteRequests(businessId, acceptQuoteReq)`** — toggles `accept_quote_req` for “accept quote requests on public link” (see `acceptQuoteRequests.js`).

### 4. Web API — send quote (Next.js)

Module: `src/features/quotes/api/sendQuote.js`

Uses `Authorization: Bearer <accessToken>` and a client-generated **`X-Request-ID`** ( echoed by the server when supported).

| Operation                             | Method | Path                                 | Success HTTP |
| ------------------------------------- | ------ | ------------------------------------ | ------------ |
| New quote (first send)                | `POST` | `{origin}/api/quotes/send`           | **201**      |
| Send existing row (e.g. from request) | `POST` | `{origin}/api/quotes/{quoteId}/send` | **200**      |

**Production guard:** non-dev builds require a valid **https** origin (see `productionHttpsGuard` in `sendQuote.js`).

### Mobile ⇄ server JSON contract (send body)

Built by **`validateSendQuotePayload`** in `src/features/quotes/utils/validateSendQuotePayload.js` (wizard state → validated object).

**Required / typical fields on the wire:**

| Field                                                | Notes                                                  |
| ---------------------------------------------------- | ------------------------------------------------------ |
| `businessSlug`                                       | string                                                 |
| `customerName`, `customerEmail`                      | string                                                 |
| `customerPhone`                                      | optional, 10-digit US string when present              |
| `serviceName`                                        | string                                                 |
| `priceCents`                                         | integer                                                |
| `durationMinutes`                                    | integer, &gt; 0                                        |
| `scheduledDate`                                      | `YYYY-MM-DD`                                           |
| `scheduledStartTime`                                 | `HH:mm` 24h (`:00` or `:30` only from the time picker) |
| `vehicleYear`, `vehicleMake`, `vehicleModel`, `note` | optional; omitted when empty                           |

**Success response shape** (parsed in `parseSendQuoteResponse`):

- Top level: `success === true`
- `data`: object with string fields **`quoteId`**, **`publicUrl`**, **`expiresAt`**

Any other shape or wrong status → mobile maps HTTP status + `error` / `message` to user-facing copy via **`mapSendQuoteHttpError`**.

## Inbox partitioning (mobile-only rule)

`partitionQuotesForInbox` in `src/features/quotes/utils/quotePresentation.js`:

- **Quote requests tab:** `source === 'customer_requested'` **and** `status === 'requested'`.
- **Sent quotes tab:** all other `quotes` rows for that business (including drafts, sent, viewed, etc.).

Detail kind for UI: **`deriveQuoteDetailKind`** uses the same rule → **request** vs **sent** bodies (`QuoteRequestDetailBody` vs `SentQuoteDetailBody`).

## Caching (React Query)

`src/features/quotes/queryKeys.js`:

- `quotesListQueryKey(businessId)` — inbox list.
- `quoteDetailQueryKey(businessId, quoteId)` — detail.
- After a successful send, the wizard invalidates list (and detail when sending from an existing request id).

`useQuoteDetail` may **fall back** to the cached list if `fetchQuoteByIdForBusiness` returns no row (stale id, timing). If still missing, the user sees `QUOTE_DETAIL_NOT_FOUND_USER_MESSAGE` from `constants.js`.

## Tests

Unit tests live under `src/features/quotes/__tests__/` (presentation, validation, step guards, status pill theme, schedule label). Run:

`npm test -- --testPathPattern=features/quotes/__tests__`

## Debug logging (`[quotes:…]`)

All quote diagnostics go through **`src/features/quotes/utils/quotesDebug.js`**. They run **only when `__DEV__` is true** — nothing is printed in production release builds.

Tags are namespaced for quick filtering:

- **Supabase:** `fetchQuotesForBusiness:*`, `fetchQuoteByIdForBusiness:*`, `fetchActiveQuoteLinkExpiry:*`, `deleteQuoteForBusiness:*`
- **HTTP send:** `postSendQuote:start`, `postSendQuote:ok`, `postSendQuote:fail`, `postSendQuote:network` (includes `httpStatus`, `requestId`, `mode` — no customer PII or full JSON bodies)
- **Supabase settings:** `updateAcceptQuoteRequests:failed`
- **Hooks (errors only):** `useQuotesInbox:listQuery:throw`, `useQuotesInbox:persistAcceptQuoteRequests`, `useQuoteDetail:detailQuery:quote-fetch-throw`, `useQuoteDetail:detailQuery:not-found`

Use the **`X-Request-ID`** / echoed `requestId` on failures to correlate with server logs.

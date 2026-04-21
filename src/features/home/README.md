# Home screen

The home tab is the owner’s dashboard after sign-in. It surfaces **booking link analytics**, **public share URL**, **next upcoming appointment**, and **count of upcoming confirmed bookings**. All server reads go through **Supabase** with the authenticated user’s JWT (anon key + RLS).

---

## Architecture (code map)

| Area | Role |
|------|------|
| `screens/HomeScreen.jsx` | Composes sections; calls `useHomeDashboard()` once and passes props to children (avoids duplicate fetches). |
| `hooks/useHomeDashboard.js` | **TanStack Query** for business + bookings (cached, deduped); **stale-only refetch** on tab focus; exposes `refetch()` for pull-to-refresh; `businessError` / `bookingsError` and derived fields. |
| `api/homeDashboard.js` | `fetchBusinessProfileForUser` only; booking list helpers live in **`bookings/api/bookings.js`** (re-exported here for compatibility). |
| `utils/bookingStart.js` | Combines `scheduled_date` + `start_time` in **device local** time; relative “Starts in …” copy. |
| `utils/bookingLink.js` | Host + display/HTTPS URL helpers; slug comes **only** from `business_profiles.business_slug` (see Link row empty state if missing). |
| `utils/bookingAddress.js` | Joins granular address columns into one string for maps (`formatBookingAddressForMaps`). |
| `utils/appointmentOutbound.js` | **On my way** → `sms:` with preset body; **Navigate** → Apple Maps / `geo:` / Google Maps from formatted address. |
| `components/LinkStatsSection.jsx` | Link views + copyable URL. |
| `components/NextUpCard.jsx` | Next appointment + **On my way** (SMS) / **Navigate** (maps). |
| `components/TotalScheduledCard.jsx` | Upcoming count; tap → Bookings tab. |

Shared UI: `SurfaceCard` / `SpotlightCard` (`src/components/ui/Card.jsx`), `Button`, `SkeletonBox`, `InlineCardError` (`src/components/ui/`).

### Automated tests (`__tests__/`)

Run from repo root: `npm test` (Jest + `jest-expo` + React Native Testing Library).

| File | What it covers |
|------|----------------|
| `homeDashboard.test.js` | `partitionUpcomingConfirmed`, `bookingTitleLine` (ordering, filters, titles). |
| `bookingAddress.test.js`, `bookingStart.test.js`, `bookingLink.test.js` | Pure helpers used by Home and outbound flows. |
| `LinkStatsSection.test.jsx` | Loading / loaded / error UI; copy uses `expo-clipboard`. |
| `NextUpCard.test.jsx` | Skeleton, empty, filled state; SMS/maps handlers (mocked). |
| `TotalScheduledCard.test.jsx` | Labels, navigation to `ROUTES.BOOKINGS`, disabled while loading. |
| `HomeScreen.test.jsx` | Section labels, sync hint vs initial load (mocked dashboard). |
| `useHomeDashboard.test.jsx` | React Query + mocked Supabase fetch fns; errors; `refetch`. |

Shared helpers: `testUtils.jsx` (`renderWithProviders`, test `QueryClient`). Global Jest setup: `jest.setup.js` (AsyncStorage mock, Reanimated mock, placeholder env for Supabase URL/key, `@expo/vector-icons` stub, TanStack **`notifyManager` synchronous batching** to reduce `act()` noise). `npm test` uses **`--runInBand --forceExit`** so the process exits cleanly despite stray native/Jest timers.

---

## Database: tables and columns

### `business_profiles`

- **Purpose:** One row per business; scoped to the signed-in owner (v1: one business per user).
- **Join to auth:** `profile_id` = `auth.users.id` (same as `profiles.user_id`).
- **Fields used on Home:**

  | Column | Home usage |
  |--------|------------|
  | `id` | Used as `business_id` when querying `bookings`. |
  | `business_slug` | Public path segment: `myservicelink.app/{slug}` (with `https://` on copy). |
  | `profile_views` | Shown as **Link views** (integer; formatted with `toLocaleString()`). |

### `bookings`

- **Purpose:** Confirmed appointments for a business.
- **Join:** `business_id` → `business_profiles.id`.
- **Fields used on Home:**

  | Column | Home usage |
  |--------|------------|
  | `scheduled_date` | `date`; combined with `start_time` for ordering and “future” checks. |
  | `start_time` | `time`; combined with `scheduled_date` in JS (device local). |
  | `status` | Only **`confirmed`** rows are loaded for upcoming logic. |
  | `service_name` | Second line of “Next up” title: `{customer} — {service}`. |
  | `customer_name` | First part of “Next up” title. |
| `customer_phone` | **On my way** — native SMS (`sms:`) with a preset message. |
| `customer_street_address`, `customer_unit_apt`, `customer_city`, `customer_state`, `customer_zip` | **Navigate** — concatenated in app (see below); no single `customer_address` column today. |

**Ignored on Home (by design):** `booking_requests` and non-`confirmed` statuses (`cancelled`, `complete`, etc.) for upcoming/next counts.

### Customer address: granular columns vs one “full address” field

**Today:** The database stores address **parts** (street, unit, city, state, zip). The app builds one line for map URLs via **`formatBookingAddressForMaps()`** in `utils/bookingAddress.js` (same shape as `BOOKING_SELECT` in `api/homeDashboard.js`). That is the right approach for v1: one source of truth in normalized columns, no duplicate string to keep in sync.

**Optional later (if you want):**

- Add a **generated column** or **trigger-maintained** `customer_address_full text` for reporting/search, derived from the parts (still edit parts in UI).
- Or add **`location_text` / `formatted_address`** only if you integrate **Places autocomplete** and want to store the provider’s single string *in addition to* structured fields.

**Recommendation:** Keep structured fields for validation and mailers; avoid hand-editing a lone “full address” without also updating parts. If you add a denormalized full string, generate it from the parts in SQL or on save so mobile and web never diverge.

---

## Queries and data flow

1. **`fetchBusinessProfileForUser(userId)`**  
   - `from('business_profiles').select('id, business_slug, profile_views').eq('profile_id', userId).maybeSingle()`

2. **`fetchConfirmedBookingsFromToday(businessId)`**  
   - `from('bookings').select(...).eq('business_id', businessId).eq('status', 'confirmed').gte('scheduled_date', today)`  
   - `today` = **device-local** `YYYY-MM-DD` (`localYyyyMmDd()`).  
   - Ordered by `scheduled_date`, then `start_time`, ascending.

3. **Client-side filtering** (`partitionUpcomingConfirmed`)  
   - Keeps rows where `scheduled_date` + `start_time` parses to **`>= now`** (device local).  
   - **Next up** = earliest such row.  
   - **Scheduled count** = number of such rows (confirmed + strictly future).

4. **Slug**  
   - Display and copy use **`business_profiles.business_slug` only**. If null/empty after load, the UI shows a short hint and **Copy** is disabled (no hardcoded or metadata slug).

5. **When data loads**  
   - `useHomeDashboard` runs `load()` on **every focus** of the Home tab (simple freshness; no separate cache layer yet).

---

## UI behavior (functional)

- **Booking link · Link views:** Number from `profile_views`; caption explains it’s the only tracked stat.  
- **Booking link · URL row:** Displays `myservicelink.app/{slug}`; copy writes `https://myservicelink.app/{slug}`.  
- **Upcoming · Next up:** Shows next **confirmed** appointment with **future** start; relative subtitle (“Starts in …”); empty state if none; **On my way** opens Messages with a preset SMS (needs `customer_phone`); **Navigate** opens maps when **at least one address part** composes a non-empty formatted line (`bookingAddress.js`). Each button is disabled if phone / formatted address is unusable.  
- **Scheduled:** Count of upcoming confirmed appointments; card is pressable → navigates to **Bookings** tab (disabled while loading or when that section has an error).  
- **Loading:** Skeleton placeholders inside each card (no spinners) only when there is **no cached data** yet; background refetch keeps showing the last good payload.  
- **Sync:** Subtle **“Updating…”** line while a stale refetch runs; **pull-to-refresh** forces a full home refetch.  
- **Errors:** `businessError` → **Booking link** section shows `InlineCardError`; link row shows an unavailable hint. `bookingsError` (business loaded) → **Next up** and **Scheduled** cards show the error; link section stays usable.

---

## Known limitations (intentional for now)

- **Time zones:** `scheduled_date` + `start_time` are interpreted in the **device’s local timezone**, not a per-business IANA zone. Multi-region accuracy will need `timestamptz` + `business_profiles.timezone` (or equivalent).  
- **Network shape:** Two round-trips (business, then bookings). Can be collapsed to one RPC or a view later.  
- **Pagination:** All matching bookings from “today” onward are loaded; fine for small volumes; needs limits or server aggregation at scale.  
- **RLS:** Assumes policies allow the owner to read their `business_profiles` and related `bookings`; not documented in SQL here—keep policies in Supabase in sync with this app.

---

## TODO — improvements for correctness, UX, and efficiency

Use this as a working backlog; check items off as you ship.

### Data model & backend

- [ ] Add **`starts_at timestamptz`** (and optional **`business_profiles.timezone`**) and migrate off raw `date` + `time` for unambiguous “future” and cross-timezone owners.  
- [ ] Confirm **`bookings.status`** enum spelling in DB (`complete` vs `completed`) and document in SQL migrations.  
- [ ] Align **`customer_name`** (or document actual column) with `BOOKING_SELECT` / `bookingTitleLine`.  
- [ ] Add **Supabase RLS** review checklist (or SQL snapshots) next to this doc so mobile and dashboard stay aligned.  
- [ ] Optional: single **`rpc` / SQL view** for “home dashboard” payload (business + next booking + count) to cut latency and duplicate logic.

### Caching, loading, and sync

- [x] **TanStack Query** for deduped fetches, cache, and background refetch (`src/lib/queryClient.js`, `QueryClientProvider` in `App.js`).  
- [x] **Stale-while-revalidate:** last good data stays visible; **“Updating…”** when `isFetching` and initial load is done.  
- [x] **Pull-to-refresh** on Home `ScrollView` → `refetch()` (forces refetch of all queries under `['home']`).  
- [x] **Refetch on focus:** only queries that are **stale** (`refetchQueries` with `stale: true`) so tab switches do not hammer the network; tune per-query `staleTime` in `useHomeDashboard` as needed.  
- [ ] Optional later: **realtime** (`postgres_changes`) or polling for time-sensitive booking changes.

### Product / UX

- [x] Wire **On my way** / **Navigate** (SMS + maps from booking phone and granular address).  
- [ ] Optional: add **generated full-address** column or Places-backed `formatted_address` if product needs search/reporting on one string.  
- [ ] **Empty / error states:** richer copy, retry button, link to support when `business_profiles` is missing.  
- [ ] **Notifications (future):** nudge when `confirmed` appointments are in the past but not marked `complete`.  
- [ ] **Accessibility:** audit VoiceOver/TalkBack for dynamic counts and loading placeholders.

### Performance & scale

- [ ] Cap **`bookings`** query (e.g. `limit` + index on `(business_id, scheduled_date, start_time)`) or move “count + next” to **aggregate SQL**.  
- [ ] Monitor **PostgREST** payload size as booking history grows.

### Testing & ops

- [x] **Unit + component tests** for Home (`src/features/home/__tests__/`) — pure helpers, cards, screen composition, `useHomeDashboard` with mocked API.  
- [ ] Add **broader integration tests** (e.g. DST midnight boundaries, E2E on device).  
- [ ] Document **required env**: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` for new contributors.

---

## Related files outside this feature

- `src/lib/supabase.js` — Supabase client (encrypted session storage on native).  
- `src/lib/queryClient.js` — shared React Query client; **`queryClient.clear()`** on sign-out in `AuthContext` so the next user never sees cached home data.  
- `src/features/auth/` — Session and `useAuth()` consumed by `useHomeDashboard`.  
- `src/routes/routes.js` — `ROUTES.BOOKINGS` for navigation from the Scheduled card.

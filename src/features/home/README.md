# Home screen

The home tab is the owner’s dashboard after sign-in. It surfaces **booking link analytics**, **public share URL**, **the next spotlight booking** (upcoming or in progress), and **today’s timeline** (“Rest of Today”). All server reads go through **Supabase** with the authenticated user’s JWT (anon key + RLS).

---

## `HomeScreen.jsx` composition (top → bottom)

Order matches the scroll layout; useful when tracing UX or adding a section.

1. **Header** — Business display name (`business_profiles.business_name`, fallback “there”) + notifications affordance → `ROUTES.NOTIFICATIONS_INBOX`.
2. **`Updating…`** — Shown when any home query is refetching and the screen is not on the initial blank load (`isFetching && !isLoading`).
3. **`HomeErrorBanner`** — Top-level message when `computeHomeErrorPresentation` sets `bannerError` (e.g. business profile failed, or deduped same error across queries).
4. **Next Up block** — Section title (**`In progress`** vs **`Next Up`**) from `dashboard.spotlightMode`, then **`NextUpCard`** (see [Next Up card](#next-up-card-nextupcardjsx) below).
5. **Booking link** — `LinkStatsSection` (views + slug URL).
6. **Rest of Today** — `RestOfTodayCard` (separate query for today’s bookings).
7. **`FloatingCreateMenu`** — Create appointment / quote entry points (overlay).

`useHomeDashboard()` is called once; **`useHomeQuickMarkComplete()`** handles mark-complete from the Next Up card when the spotlight is in progress.

> **`TotalScheduledCard`** exists under `components/` (upcoming count → Bookings tab) but is **not** mounted on the current Home screen; keep the component/tests if you reintroduce that row.

---

## Architecture (code map)

| Area                                | Role                                                                                                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `screens/HomeScreen.jsx`            | Composes sections; calls `useHomeDashboard()` once and passes props to children (avoids duplicate fetches).                                                                      |
| `hooks/useHomeDashboard.js`         | **TanStack Query** for business + upcoming spotlight bookings + “today” list; **stale-only refetch** on tab focus; exposes `refetch()` for pull-to-refresh; errors per query.    |
| `hooks/useHomeQuickMarkComplete.js` | Mutation: `markBookingCompletedById` + **`invalidateBookingCachesAfterMutation`** (same invalidation as booking details).                                                        |
| `api/homeDashboard.js`              | `fetchBusinessProfileForUser` only; booking list helpers live in **`bookings/api/bookings.js`** (re-exported here for compatibility).                                            |
| `utils/bookingStart.js`             | Combines `scheduled_date` + `start_time` in **device local** time; relative “Starts in …” and in-progress subtitle copy.                                                         |
| `utils/bookingLink.js`              | Host + display/HTTPS URL helpers; slug comes **only** from `business_profiles.business_slug` (see Link row empty state if missing).                                              |
| `utils/bookingAddress.js`           | Joins granular address columns into one string for maps (`formatBookingAddressForMaps`).                                                                                         |
| `utils/appointmentOutbound.js`      | **On my way** → `sms:` with preset body; **Navigate** → Apple Maps / `geo:` / Google Maps from formatted address.                                                                |
| `utils/homeErrorPresentation.js`    | **`computeHomeErrorPresentation`** — dedupes errors so the same failure is not repeated in banner + every card (`bannerError`, `nextUpBookingsError`, `restOfTodayError`, etc.). |
| `components/LinkStatsSection.jsx`   | Link views + copyable URL.                                                                                                                                                       |
| `components/NextUpCard.jsx`         | Spotlight booking: empty / error / skeleton / **upcoming** actions vs **in progress** + mark complete.                                                                           |
| `components/RestOfTodayCard.jsx`    | Today timeline (separate from “next spotlight” logic).                                                                                                                           |
| `components/TotalScheduledCard.jsx` | Optional: upcoming count; tap → Bookings tab (**not** on current `HomeScreen`).                                                                                                  |

Shared UI: `SurfaceCard` / `SpotlightCard` (`src/components/ui/Card.jsx`), `Button`, `SkeletonBox`, `InlineCardError` (`src/components/ui/`).

---

## Next Up card (`NextUpCard.jsx`)

The card is the **hero** for the owner’s next actionable visit. What it shows depends on **loading**, **errors**, **whether a spotlight booking exists**, and **`spotlightMode`** (from server rows + `pickHomeSpotlight` in `bookings/api/bookings.js`).

### Where `spotlightMode` comes from

`useHomeDashboard` runs `pickHomeSpotlight(rows, nowMs)` on confirmed bookings from today onward:

| `spotlightMode`   | Meaning                                                                                                                                                                      | `nextBooking` in payload |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **`in_progress`** | A **confirmed** booking has **started** (start ≤ now) and is still **before expected end** (start + `duration_minutes`, default **120** if missing). Earliest such row wins. | That in-progress row     |
| **`upcoming`**    | No row in that in-progress window; show the **earliest future** confirmed start (same as `partitionUpcomingConfirmed` “next”).                                               | That upcoming row        |
| **`none`**        | No upcoming row after filtering.                                                                                                                                             | `null`                   |

Subtitle on Home (`nextSubtitle`): **in progress** → `formatInProgressSubtitle` (e.g. started time); **upcoming** → `formatNextUpWhenLine` (e.g. relative “Starts in …”).

### Props (contract)

| Prop                              | Source on Home                                                           | Role                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `isLoading`                       | `sectionLoading` = pending business **or** pending upcoming bookings     | Skeleton state                                                                              |
| `businessError` / `bookingsError` | `homeErrors.nextUpBusinessError` / `homeErrors.nextUpBookingsError`      | First non-null becomes in-card `InlineCardError` (see dedupe in `homeErrorPresentation.js`) |
| `nextBooking`                     | `dashboard.nextBooking`                                                  | Spotlight row or `null`                                                                     |
| `subtitle`                        | `dashboard.nextSubtitle`                                                 | Time / “started” line under customer name when not empty                                    |
| `spotlightMode`                   | `dashboard.spotlightMode`                                                | `'in_progress' \| 'upcoming' \| 'none'`                                                     |
| `onMarkComplete`                  | Set only when `spotlightMode === 'in_progress'` **and** booking has `id` | Async handler from `HomeScreen`                                                             |
| `markCompleteLoading`             | `markCompleteMutation.isPending`                                         | Disables button + loading UI                                                                |

### Visual / UX states (render priority in code: **loading → error → empty → filled**)

`NextUpCard` returns the skeleton **first** when `isLoading` is true, so a refetch that keeps `isLoading` true (e.g. first paint) shows skeleton even if an error string is also passed—after bookings resolve, errors or empty state appear.

1. **Loading** (`isLoading`)
   - **Skeleton** inside `SpotlightCard` (name/when lines + action placeholders).
   - Home sets this when **business** or **upcoming bookings** query is still pending (`sectionLoading`).

2. **Schedule error** (`businessError || bookingsError`, when not loading)
   - Renders **`InlineCardError`** with that message.
   - **No** empty state and **no** action row.

3. **Empty** (not loading, no error, `nextBooking == null`)
   - **Badge:** 44×44 circle — **black** fill + **white** `calendar-outline` on light Next Up surfaces; **inverted** (white circle, dark icon) on dark Next Up surfaces so the badge stays visible.
   - **Title:** “Nothing scheduled yet”
   - **Body:** “Your next booking will show up here.”
   - **No** primary/secondary actions.

4. **Filled — `spotlightMode === 'upcoming'`**
   - Customer name, optional `subtitle`, service line (from `buildNextUpHeadlines` / `formatNextUpServiceLine`), optional vehicle line.
   - **No** live pulse (`testID="next-up-live-pulse"` absent).
   - **Actions:** **`On my way`** (SMS) + **`Navigate`** (maps).
   - Buttons **disabled** without usable phone / formatted address (same rules as before).

5. **Filled — `spotlightMode === 'in_progress'`**
   - Name row includes **animated green pulse** dot (`testID="next-up-live-pulse"`).
   - **Single full-width** primary: **Mark complete** (`variant` flips with surface: `surfaceDark` on white card, `surfaceLight` on dark).
   - **Mark complete** is disabled if `onMarkComplete` is missing **or** `markCompleteLoading`.
   - **Confirmation:** first tap runs **`Alert.alert`** — title “Mark complete?”, message “This will mark the booking as completed.”, **Cancel** / **Mark complete**; the mutation runs only on confirm.
   - On failure, `HomeScreen` shows **`Alert.alert`** with `safeUserFacingMessage`.

6. **Accessibility**
   - When filled and no schedule error, the card gets an **`accessibilityLabel`** summarizing in-progress vs name, subtitle, service, vehicle.

### Related code

- **Selection logic:** `pickHomeSpotlight`, `bookingExpectedEndMs`, `partitionUpcomingConfirmed` — `src/features/bookings/api/bookings.js`.
- **Mark complete + cache:** `useHomeQuickMarkComplete.js`, `invalidateBookingCachesAfterMutation.js` (booking-details feature).
- **Tests:** `NextUpCard.test.jsx` (skeleton, empty, upcoming vs in-progress, alert confirm/cancel, SMS/maps mocks).

---

## Automated tests (`__tests__/`)

Run from repo root: `npm test` (Jest + `jest-expo` + React Native Testing Library).

| File                                                                    | What it covers                                                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `homeDashboard.test.js`                                                 | `partitionUpcomingConfirmed`, `pickHomeSpotlight`, `bookingTitleLine` (ordering, filters, titles). |
| `bookingAddress.test.js`, `bookingStart.test.js`, `bookingLink.test.js` | Pure helpers used by Home and outbound flows.                                                      |
| `LinkStatsSection.test.jsx`                                             | Loading / loaded / error UI; copy uses `expo-clipboard`.                                           |
| `NextUpCard.test.jsx`                                                   | Skeleton, empty, filled state; SMS/maps handlers (mocked).                                         |
| `TotalScheduledCard.test.jsx`                                           | Labels, navigation to `ROUTES.BOOKINGS`, disabled while loading.                                   |
| `HomeScreen.test.jsx`                                                   | Section labels, sync hint vs initial load (mocked dashboard).                                      |
| `useHomeDashboard.test.jsx`                                             | React Query + mocked Supabase fetch fns; errors; `refetch`.                                        |

Shared helpers: `testUtils.jsx` (`renderWithProviders`, test `QueryClient`). Global Jest setup: `jest.setup.js` (AsyncStorage mock, Reanimated mock, placeholder env for Supabase URL/key, `@expo/vector-icons` stub, TanStack **`notifyManager` synchronous batching** to reduce `act()` noise). `npm test` uses **`--runInBand --forceExit`** so the process exits cleanly despite stray native/Jest timers.

---

## Database: tables and columns

### `business_profiles`

- **Purpose:** One row per business; scoped to the signed-in owner (v1: one business per user).
- **Join to auth:** `profile_id` = `auth.users.id` (same as `profiles.user_id`).
- **Fields used on Home:**

  | Column          | Home usage                                                                 |
  | --------------- | -------------------------------------------------------------------------- |
  | `id`            | Used as `business_id` when querying `bookings`.                            |
  | `business_slug` | Public path segment: `myservicelink.app/{slug}` (with `https://` on copy). |
  | `profile_views` | Shown as **Link views** (integer; formatted with `toLocaleString()`).      |

### `bookings`

- **Purpose:** Confirmed appointments for a business.
- **Join:** `business_id` → `business_profiles.id`.
- **Fields used on Home:**

  | Column                                                                                            | Home usage                                                                                 |
  | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
  | `scheduled_date`                                                                                  | `date`; combined with `start_time` for ordering and “future” checks.                       |
  | `start_time`                                                                                      | `time`; combined with `scheduled_date` in JS (device local).                               |
  | `status`                                                                                          | Only **`confirmed`** rows are loaded for upcoming logic.                                   |
  | `service_name`                                                                                    | Second line of “Next up” title: `{customer} — {service}`.                                  |
  | `customer_name`                                                                                   | First part of “Next up” title.                                                             |
  | `customer_phone`                                                                                  | **On my way** — native SMS (`sms:`) with a preset message.                                 |
  | `customer_street_address`, `customer_unit_apt`, `customer_city`, `customer_state`, `customer_zip` | **Navigate** — concatenated in app (see below); no single `customer_address` column today. |

**Ignored on Home (by design):** `booking_requests` and non-`confirmed` statuses (`cancelled`, `complete`, etc.) for upcoming/next counts.

### Customer address: granular columns vs one “full address” field

**Today:** The database stores address **parts** (street, unit, city, state, zip). The app builds one line for map URLs via **`formatBookingAddressForMaps()`** in `utils/bookingAddress.js` (same shape as `BOOKING_SELECT` in `api/homeDashboard.js`). That is the right approach for v1: one source of truth in normalized columns, no duplicate string to keep in sync.

**Optional later (if you want):**

- Add a **generated column** or **trigger-maintained** `customer_address_full text` for reporting/search, derived from the parts (still edit parts in UI).
- Or add **`location_text` / `formatted_address`** only if you integrate **Places autocomplete** and want to store the provider’s single string _in addition to_ structured fields.

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
   - `useHomeDashboard` **refetches stale** queries on Home tab **focus** (`refetchQueries` with `stale: true`); see `staleTime` on each query in the hook.

---

## UI behavior (functional)

- **Booking link · Link views:** Number from `profile_views`; caption explains it’s the only tracked stat.
- **Booking link · URL row:** Displays `myservicelink.app/{slug}`; copy writes `https://myservicelink.app/{slug}`.
- **Next Up / In progress:** Spotlight booking from **`pickHomeSpotlight`** — can be **in progress** (started, within duration window) or **next upcoming**; section title switches on Home. Full state matrix: [Next Up card](#next-up-card-nextupcardjsx).
- **Rest of Today:** Separate query and card; errors deduped via `computeHomeErrorPresentation` (`restOfTodayError`).
- **Loading:** Per-section skeletons where implemented; TanStack Query keeps **last good data** visible during background refetch.
- **Sync:** **“Updating…”** while `isFetching` and initial load is done; **pull-to-refresh** refetches all `HOME_QUERY_KEY` queries.
- **Errors:** Deduped in **`homeErrorPresentation.js`** — e.g. one **banner** for profile failure; **Next Up** / **Rest of Today** / link section each get distinct messages only when they differ (see `computeHomeErrorPresentation`).

---

## Known limitations (intentional for now)

- **Time zones:** `scheduled_date` + `start_time` are interpreted in the **device’s local timezone**, not a per-business IANA zone. Multi-region accuracy will need `timestamptz` + `business_profiles.timezone` (or equivalent).
- **Network shape:** Three queries when business exists (business profile, upcoming-from-today for spotlight, today-only for Rest of Today). Can be collapsed to one RPC or a view later.
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

# Mobile pricing, subscription, and Pro gates

Authoritative **product narrative** (Plans, Stripe webhooks, feature matrix wording) lives in the web repo’s **`pricing-strategy-and-model.md`**.  
This doc describes **what the React Native app implements**: which **`profiles`** / **`business_profiles`** fields drive behavior, **how scenarios map to UI**, and **where the code lives**.

---

## Principles

| Principle                     | Detail                                                                                                                                                                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server is SoT for billing** | Webhooks + APIs update Supabase (`subscription_tier`, `subscription_status`, Stripe ids). Mobile reads the account bundle or direct Supabase as documented below.                                                                              |
| **One Pro predicate in app**  | `hasProAccessFromProfile` → `isProAccess` in `src/features/more/utils/subscriptionPresentation.js`. Booking link badges, create-appointment pricing, `useSubscription()`, and account UI all use this (not a second copy in `bookingLink.js`). |
| **Public visitor experience** | Booking page and appointment submission are **web**; mobile does not replicate public “live” rules or visitor caps. Mobile focuses on **owner** tools and correct **in-app** gates.                                                            |
| **SMS / check-in**            | Not implemented in mobile; no gates or copy here.                                                                                                                                                                                              |

---

## Profile data the app uses

Loaded primarily via **`fetchAccountSettingsBundle`** → `SubscriptionContext` (`ownerProfile`).  
Direct Supabase reads (e.g. booking link) still use the same **`profiles`** row shape for Pro.

| Field                               | Role                                                                                                                                                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subscription_tier`                 | Normalized to lowercase. Explicit `free` / `free_tier` → **never Pro**. Substring `pro` in tier (e.g. `pro`) → used for comped and billed checks.                                                                      |
| `subscription_status`               | For **billed** users (non-empty `stripe_subscription_id`): Pro only if `active`, `trialing`, or **empty string** (webhook lag grace). `canceled`, `past_due`, `unpaid`, etc. → **not Pro**.                            |
| `stripe_customer_id`                | Presence contributes to **Stripe billing history**. With Pro tier but **no** sub id and **no** customer id → **comped Pro**. If **customer id exists** but no subscription id → **not** comped; not Pro via that path. |
| `stripe_subscription_id`            | Non-empty → **billed** path; requires Pro tier + valid status (above).                                                                                                                                                 |
| `subscription_current_period_end`   | Passed into `isProAccess` for API stability; **ignored for access** (matches web: status is source of truth for entitlement). Still used for **display** (renewal / trial end copy) in `getSubscriptionAccessLine`.    |
| `subscription_cancel_at_period_end` | UI only (e.g. “Pro access until …” / header badge) when user still has Pro.                                                                                                                                            |

**Billing history (cohort B)** — `hasStripeBillingHistoryFromProfile`:

`true` if **any** of these is non-empty after trim: `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`.

Used for **full-screen upgrade** gating (see below), together with **`isExplicitFreeSubscriptionTier`**: if the profile tier is explicitly `free` / `free_tier`, the user is **not** paywalled full-screen even when these fields are still set after cancel. **Legacy never-billed Free** has none of these set → not cohort B.

---

## Scenarios → mobile behavior

| Scenario                                                                                      | `hasProAccess` | `hasStripeBillingHistory`    | Main app tabs | Notes                                                                                                                                         |
| --------------------------------------------------------------------------------------------- | -------------- | ---------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Never billed Free** (no Stripe ids, no status string)                                       | `false`        | `false`                      | **Yes**       | Full navigation; **Free limits** apply in individual screens (bookings count, services count, gallery, quotes toggle, payments upsell, etc.). |
| **Trialing** (Pro tier + `trialing` + sub id)                                                 | `true`         | usually `true`               | **Yes**       | Same Pro surfaces as paid.                                                                                                                    |
| **Pro paying** (`active` + sub id + Pro tier)                                                 | `true`         | `true`                       | **Yes**       |                                                                                                                                               |
| **Comped / manual Pro** (Pro tier, **no** customer id, **no** sub id)                         | `true`         | `false` if status also empty | **Yes**       | Matches web comped rules.                                                                                                                     |
| **Churned to explicit Free** (tier `free` / `free_tier`, may still have customer id / status) | `false`        | often `true`                 | **Yes**       | Full-screen paywall **off**; same as never-billed for navigation — free limits in screens.                                                    |
| **Churned Pro tier** (still `pro` in DB + canceled / unpaid + Stripe history, not entitled)   | `false`        | `true`                       | **Blocked**   | `UpgradePaywallScreen` when paywall flag on — resubscribe or billing portal until tier flips to free.                                         |

---

## `isProAccess` (implementation summary)

Implementation: `subscriptionPresentation.js` → `isProAccess`.

1. If normalized tier is `free` or `free_tier` → **`false`**.
2. Else if tier contains `pro` **and** no subscription id **and** no customer id → **`true`** (comped).
3. Else if subscription id is non-empty: require tier contains `pro`; then if status string is empty → **`true`** (grace); else only **`active`** or **`trialing`** → **`true`**.
4. Otherwise **`false`** (includes Pro tier + customer id but no subscription id → not comped, not billed Pro).

Trials (`trialing`) and paid (`active`) are both Pro when Stripe subscription id exists and tier is Pro.

---

## Full-screen upgrade paywall

| Item              | Detail                                                                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**       | Align **cohort B** (touched Stripe) who **lost Pro** with web: resolve billing or subscribe before using the tabbed app.                                                                                           |
| **Gate**          | `shouldShowFullScreenSubscriptionPaywall` in `src/features/subscription/upgradePaywallGate.js`.                                                                                                                    |
| **Condition**     | `ENABLE_FULL_SCREEN_UPGRADE_PAYWALL` **`&&`** `isPaywallDataStable` **`&&`** `!hasProAccess` **`&&`** `!isExplicitFreeSubscriptionTier(ownerProfile)` **`&&`** `hasStripeBillingHistoryFromProfile(ownerProfile)`. |
| **Stability**     | `isPaywallDataStable` from `SubscriptionContext` avoids flashing paywall during refetches (e.g. after onboarding Checkout).                                                                                        |
| **Master switch** | `ENABLE_FULL_SCREEN_UPGRADE_PAYWALL`. Set **`false`** to allow cohort B back into tabs with **in-screen** upsells only (product choice).                                                                           |

**Mounted in:** `src/navigation/AuthNavigator.jsx` (needs `ownerProfile` from `useSubscription()`).

---

## `SubscriptionContext` (`useSubscription()`)

Exports used across features:

| Export                 | Meaning                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `hasProAccess`         | `hasProAccessFromProfile(ownerProfile)`.                                           |
| `ownerProfile`         | Raw owner row bundle; drives paywall history check.                                |
| `isOwnerProfileLoaded` | Successful account query; use for gates that shouldn’t flicker before data exists. |
| `isPaywallDataStable`  | Safe moment to evaluate full-screen paywall.                                       |
| `isLoading`            | Initial pending (used with paywall to show boot state).                            |

---

## Free vs Pro: in-app feature gates (owner)

These are **mobile UI / client rules**; enforcement for public booking still happens on **web/API**.

| Area                                                   | Free                                                                                                             | Pro                                         | Constants / hooks (primary)                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Booking link gallery (edit)**                        | Max 4 images                                                                                                     | Max 8                                       | `getBookingLinkGalleryMaxImages`, `bookingLink/edit/constants/galleryLayout.js`     |
| **Services list**                                      | Max 5 services (add blocked + hint)                                                                              | No app cap                                  | `FREE_TIER_MAX_SERVICES`, `ServicesScreen.jsx`                                      |
| **Bookings usage strip / create gates**                | `FREE_TIER_BOOKINGS_LIMIT` (5); uses `business_profiles.free_bookings_count` when present, else head-count query | Unlimited (no strip / cap UI)               | `src/features/bookings/constants.js`, `resolveFreeTierBookingUsed`, Home / Bookings |
| **Quote requests toggle** (`accept_quote_req`)         | Switch locked + upsell                                                                                           | Can persist toggle                          | `QuotesScreen.jsx`, `useQuotesInbox`                                                |
| **Service multi-price (`price_options_enabled`)**      | Editor blocks / dimmed pricing UI                                                                                | Full editor + create-flow pricing step      | `ServiceEditScreen.jsx`, `createFlowPricing.js`, `ownerHasPro`                      |
| **Payments / Stripe Connect**                          | Upsell / non-Pro surfaces                                                                                        | Full dashboard flow                         | `PaymentsScreen.jsx`                                                                |
| **Verified badge / request-quote CTA (owner preview)** | Badge off; CTA off unless Pro + `accept_quote_req`                                                               | From `hasProAccessFromProfile` on owner row | `bookingLink/api/bookingLink.js` (`normalizeMobileBusinessProfile`)                 |

---

## Code map

| Concern                      | Location                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Pro access + billing history | `src/features/more/utils/subscriptionPresentation.js`                                                                                  |
| Full-screen paywall decision | `src/features/subscription/upgradePaywallGate.js`                                                                                      |
| Subscription state in UI     | `src/features/subscription/context/SubscriptionContext.jsx`                                                                            |
| Navigator paywall + tabs     | `src/navigation/AuthNavigator.jsx`                                                                                                     |
| Booking link Pro-derived UI  | `src/features/bookingLink/api/bookingLink.js` (`hasProAccessFromProfile` import)                                                       |
| Unit tests (Pro + paywall)   | `src/features/more/utils/__tests__/subscriptionPresentation.test.js`, `src/features/subscription/__tests__/upgradePaywallGate.test.js` |

---

## Related docs

- **Stripe flows (mobile):** [`src/features/stripe/docs/mobile-stripe-feature-map.md`](../src/features/stripe/docs/mobile-stripe-feature-map.md)
- **Quotes feature:** [`src/features/quotes/docs/quotes-feature.md`](../src/features/quotes/docs/quotes-feature.md)
- **Onboarding / trial bridge (API contract):** [`docs/nextjs-onboarding-trial-contract.md`](./nextjs-onboarding-trial-contract.md)

Keep this file updated when **`isProAccess`**, **`hasStripeBillingHistory`**, **`ENABLE_FULL_SCREEN_UPGRADE_PAYWALL`**, or **Free-limit constants** change.

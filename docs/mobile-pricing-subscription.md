# Mobile pricing, subscription, and access gates

Authoritative product narrative lives in the web repo’s **`pricing-strategy-and-model.md`**.  
This doc describes **what the React Native app implements** after App Store cleanup: **no in-app subscription sales**, entitlements from the server, limits with **Sign in on the web**.

---

## Principles

| Principle                     | Detail                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| **Server is SoT for billing** | Webhooks + APIs update Supabase. Mobile reads the account bundle via `SubscriptionContext`.    |
| **One Pro predicate**         | `hasProAccessFromProfile` → `isProAccess` in `subscriptionPresentation.js`.                    |
| **No subscription UI in app** | No paywall, upgrade screen, pricing ($10/mo), billing portal, or Stripe subscription Checkout. |
| **Plan changes on web**       | `showWebAccountFeatureAlert` + Account web panel → `myservicelink.app/login`.                  |

---

## Profile fields (entitlement)

| Field                                           | Role                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `subscription_tier`                             | `free` / `free_tier` → never Pro. Tier contains `pro` → used for comped/billed checks. |
| `subscription_status`                           | With `stripe_subscription_id`: Pro only if `active`, `trialing`, or empty (grace).     |
| `stripe_customer_id` / `stripe_subscription_id` | Billed vs comped rules (see `isProAccess`).                                            |

Implementation: `src/features/more/utils/subscriptionPresentation.js`.

---

## Scenarios → mobile behavior

| Scenario                             | `hasProAccess` | Main app | Notes                                 |
| ------------------------------------ | -------------- | -------- | ------------------------------------- |
| Never billed free                    | `false`        | **Yes**  | Free limits + web sign-in at caps     |
| Trialing / active Pro                | `true`         | **Yes**  | Full Pro features                     |
| Comped Pro (tier pro, no Stripe ids) | `true`         | **Yes**  |                                       |
| Canceled / churned (not entitled)    | `false`        | **Yes**  | Same as free — no full-screen paywall |

---

## `useSubscription()`

| Export                 | Meaning                                               |
| ---------------------- | ----------------------------------------------------- |
| `hasProAccess`         | From `hasProAccessFromProfile(ownerProfile)`          |
| `ownerProfile`         | Owner row from account bundle                         |
| `isOwnerProfileLoaded` | Account query succeeded                               |
| `isPaywallDataStable`  | Profile refetch settled (name kept for API stability) |
| `isLoading`            | Initial account load                                  |

---

## Free vs expanded access (in-app)

| Area                    | Free (typical)    | Pro            | Primary code                                       |
| ----------------------- | ----------------- | -------------- | -------------------------------------------------- |
| Booking link gallery    | 4 images          | 8              | `galleryLayout.js`                                 |
| Services                | 5 max             | No app cap     | `ServicesScreen`, `freeTierLimits.js`              |
| Bookings                | 5 cap             | No strip       | `bookings/constants.js`, Home / Bookings           |
| Quote requests toggle   | Locked + web link | Full           | `QuotesScreen`, `quotesAccessCopy.js`              |
| Multi-price per service | Locked + web link | Full           | `ServiceEditScreen`, `servicePricingAccessCopy.js` |
| Payments / Connect      | Web upsell        | Connect flow   | `PaymentsScreen`, `PaymentsNonProUpsell`           |
| Account                 | Web panel only    | Web panel only | `AccountWebPanelNote`                              |

---

## Onboarding

Step 5 **Activate my link** → `POST /api/onboarding-v2/complete` only (no Stripe). Server should set **free** tier + `onboarding_status` completed, then app navigates to **Booking link**.

---

## Code map

| Concern               | Location                                                        |
| --------------------- | --------------------------------------------------------------- |
| Pro access            | `src/features/more/utils/subscriptionPresentation.js`           |
| Subscription state    | `src/features/subscription/context/SubscriptionContext.jsx`     |
| Web sign-in at limits | `src/features/subscription/utils/showWebAccountFeatureAlert.js` |
| Navigator             | `src/navigation/AuthNavigator.jsx`                              |
| Stripe Connect only   | `src/features/stripe/docs/mobile-stripe-feature-map.md`         |

---

## Related docs

- [`src/features/stripe/docs/mobile-stripe-feature-map.md`](../src/features/stripe/docs/mobile-stripe-feature-map.md)
- [`docs/nextjs-onboarding-trial-contract.md`](./nextjs-onboarding-trial-contract.md) — historical; mobile no longer calls trial/Checkout APIs

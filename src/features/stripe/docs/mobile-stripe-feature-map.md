# Mobile Stripe feature map

Single source of truth for Stripe-related mobile flows, code paths, env vars, and tests.

## Live flows

1. **Onboarding Pro trial (step 5)**
   - Primary: `POST /api/stripe/start-onboarding-trial` (Bearer, `{}`) — silent trial; response includes `trial_confirmation`.
   - If `fallbackToCheckout`: `POST /api/stripe/create-checkout-session` with `{ "source": "onboarding_trial_bridge", "client": "mobile" }`, open `url`, then `POST /api/stripe/confirm-onboarding-trial` (poll with `checkout_session_id` from return URL) until synced.
   - Full contract: `docs/nextjs-onboarding-trial-contract.md`.

2. **Subscription upgrade from paywall**
   - Endpoint: `POST /api/stripe/create-checkout-session`
   - Body: `{ "client": "mobile" }`
   - App behavior: open Stripe checkout via `openAuthSessionAsync`, then refetch subscription/profile.

3. **Manage subscription (billing portal)**
   - Endpoint: `POST /api/stripe/create-portal-session`
   - Body: `{ "client": "mobile" }`
   - App behavior: open portal URL via `openAuthSessionAsync`, then refetch account data.

4. **Stripe Connect onboarding (payments setup)**
   - Endpoint: `POST /api/stripe/connect/onboard`
   - Body: `{ "client": "mobile" }`
   - App behavior: open Stripe Account Link via `openAuthSessionAsync`, then call sync.
   - Contract v2: server must use HTTPS bridge URLs for Account Link return/refresh.

5. **Stripe Connect sync after return**
   - Endpoint: `POST /api/stripe/connect/sync`
   - Body: `{}`
   - App behavior: refetch payments + subscription state after sync.

6. **Turn on ServiceLink payments (post-Connect gate)**
   - Endpoint: `POST /api/payments/servicelink/enable`
   - Body: `{}`
   - App behavior: on success, refetch payments + subscription state.

## File map (current architecture)

### Shared infra

- `src/lib/stripeMobileCheckoutOrigin.js`
  - Shared origin resolution + production URL safety checks.

### Onboarding (Pro trial)

- `src/features/onboarding/api/startOnboardingTrial.js`
- `src/features/onboarding/api/confirmOnboardingTrial.js`
- `src/features/onboarding/api/createOnboardingCheckoutSession.js`
- `src/features/onboarding/utils/confirmOnboardingTrialUntilReady.js`
- `src/features/onboarding/utils/applyTrialConfirmationToOnboardingCache.js`
- `src/features/onboarding/utils/parseOnboardingStripeReturnUrl.js`
- `src/features/onboarding/constants/stripeOnboardingReturnUrl.js`
- `src/features/onboarding/utils/refetchOnboardingAfterStripe.js`
- `src/features/onboarding/screens/OnboardingScreen.jsx`
- Tests: `createOnboardingCheckoutSession`, `startOnboardingTrial`, `confirmOnboardingTrial`, `parseOnboardingStripeReturnUrl`

### Subscription (paywall + upgrade gate)

- `src/features/subscription/api/createPaywallUpgradeCheckoutSession.js`
- `src/features/subscription/constants/stripePaywallCheckoutReturnUrl.js`
- `src/features/subscription/screens/UpgradePaywallScreen.jsx`
- `src/features/subscription/upgradePaywallGate.js`
- Tests:
  - `src/features/subscription/__tests__/createPaywallUpgradeCheckoutSession.test.js`
  - `src/features/subscription/__tests__/UpgradePaywallScreen.test.jsx`
  - `src/features/subscription/__tests__/upgradePaywallGate.test.js`

### Account / billing portal

- `src/features/more/api/createBillingPortalSession.js`
- `src/features/more/constants/stripeBillingPortalReturnUrl.js`
- `src/features/more/utils/refetchAccountAfterPortal.js`
- `src/features/more/screens/AccountSettingsScreen.jsx`
- Tests:
  - `src/features/more/__tests__/createBillingPortalSession.test.js`
  - `src/features/more/__tests__/AccountSettingsScreen.subscription.test.jsx`

### Payments / Connect

- `src/features/payments/api/postStripeConnectOnboard.js`
- `src/features/payments/api/postStripeConnectSync.js`
- `src/features/payments/api/postPaymentsServicelinkEnable.js`
- `src/features/payments/constants/stripeConnectReturnUrl.js`
- `src/features/payments/screens/PaymentsScreen.jsx`
- `src/features/payments/components/PaymentsStripeConnectSetupCard.jsx`
- `src/features/payments/utils/stripeConnectSetupCopy.js`
- Tests:
  - `src/features/payments/__tests__/postStripeConnectOnboard.test.js`
  - `src/features/payments/__tests__/stripeConnectSetupCopy.test.js`
  - `src/features/payments/__tests__/PaymentsScreen.test.jsx`

## Env checklist

### Mobile app (Expo)

- `EXPO_PUBLIC_WEB_APP_URL`
- `EXPO_PUBLIC_STRIPE_ONBOARDING_AUTH_RETURN_URL` (optional override)
- `EXPO_PUBLIC_STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL` (optional override)
- `EXPO_PUBLIC_STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL` (optional override)

### Next server

- Checkout (trial + upgrade):
  - `STRIPE_MOBILE_ONBOARDING_SUCCESS_URL`
  - `STRIPE_MOBILE_ONBOARDING_CANCEL_URL`
  - `STRIPE_MOBILE_UPGRADE_SUCCESS_URL`
  - `STRIPE_MOBILE_UPGRADE_CANCEL_URL`
- Connect v2 (bridge):
  - `STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL` (HTTPS bridge URL)
  - `STRIPE_MOBILE_CONNECT_ONBOARDING_REFRESH_URL` (HTTPS bridge URL)
  - optional:
    - `STRIPE_MOBILE_CONNECT_DEEP_LINK_RETURN_URL`
    - `STRIPE_MOBILE_CONNECT_DEEP_LINK_REFRESH_URL`

## Recommended long-term layout (if we choose to refactor later)

Keep behavior as-is for now. For a dedicated Stripe domain package, move to:

- `src/features/stripe/checkout/*` (onboarding + upgrade session builders)
- `src/features/stripe/portal/*`
- `src/features/stripe/connect/*` (onboard/sync/enable + copy + return URLs)
- `src/features/stripe/gates/*` (entitlement + paywall helpers)
- `src/features/stripe/shared/*` (origin, error parsing, response guards)

This can be done incrementally behind re-export files to avoid import churn.

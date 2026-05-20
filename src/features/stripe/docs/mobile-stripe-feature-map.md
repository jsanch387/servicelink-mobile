# Mobile Stripe feature map

Stripe-related **mobile** flows, code paths, and tests. Subscription purchase and billing portal are **not** in the iOS app (App Store); plan changes happen on the web.

## Live flows

1. **Onboarding complete (step 5)**
   - `POST /api/onboarding-v2/complete` (Bearer) — marks onboarding complete, free tier on server, welcome email.
   - See `src/features/onboarding/api/completeOnboardingV2.js`.

2. **Stripe Connect onboarding (merchant payments)**
   - `POST /api/stripe/connect/onboard` with `{ "client": "mobile" }`
   - Open Account Link via `openAuthSessionAsync`, then sync.
   - Contract v2: server uses HTTPS bridge URLs for return/refresh.

3. **Stripe Connect sync after return**
   - `POST /api/stripe/connect/sync` with `{}`

4. **Enable ServiceLink payments (post-Connect)**
   - `POST /api/payments/servicelink/enable` with `{}`

## File map

### Shared

- `src/lib/stripeMobileCheckoutOrigin.js` — web API origin for mobile-authenticated requests

### Onboarding

- `src/features/onboarding/api/completeOnboardingV2.js`
- `src/features/onboarding/utils/refetchOnboardingAfterActivation.js`
- `src/features/onboarding/screens/OnboardingScreen.jsx`

### Subscription (entitlement only — no in-app purchase UI)

- `src/features/subscription/context/SubscriptionContext.jsx` — `hasProAccess`, `ownerProfile`
- `src/features/more/utils/subscriptionPresentation.js` — `hasProAccessFromProfile` / `isProAccess`
- `src/features/subscription/utils/showWebAccountFeatureAlert.js` — limits → sign in on web

### Payments / Connect

- `src/features/payments/api/postStripeConnectOnboard.js`
- `src/features/payments/api/postStripeConnectSync.js`
- `src/features/payments/api/postPaymentsServicelinkEnable.js`
- `src/features/payments/constants/stripeConnectReturnUrl.js`
- `src/features/payments/screens/PaymentsScreen.jsx`

### Hub re-exports

- `src/features/stripe/index.js`

## Env checklist (mobile)

- `EXPO_PUBLIC_WEB_APP_URL`
- `EXPO_PUBLIC_STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL` (optional)

## Removed from mobile (App Store)

- Onboarding Stripe trial / Checkout (`start-onboarding-trial`, `create-checkout-session` for onboarding)
- Full-screen upgrade paywall and in-app subscription Checkout
- Billing portal (`create-portal-session`) from Account

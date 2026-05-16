/**
 * Legacy onboarding: tapping “Activate my link” called the web API to start a Stripe
 * trial subscription, with optional Checkout fallback (`startOnboardingTrial`, etc.).
 *
 * Set to `true` only if you intentionally restore that flow on the server.
 * Default `false`: activation calls `POST /api/onboarding-v2/complete` (welcome email + free tier on server).
 */
export const ENABLE_ONBOARDING_STRIPE_TRIAL = false;

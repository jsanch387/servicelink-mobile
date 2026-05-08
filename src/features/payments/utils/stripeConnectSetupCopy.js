/** One-line subheading under “Set up payments” (first-time Connect). */
export const STRIPE_CONNECT_SETUP_MARKETING_DESCRIPTION = 'Secure payment setup with Stripe.';

/**
 * Card headline / body / button labels for `PaymentsStripeConnectSetupCard`.
 *
 * @param {{ stripe_account_id?: string | null; onboarding_status?: string | null } | null | undefined} account
 * @param {{ title: string; body: string; cta: string }} copy - from {@link getStripeConnectSetupCopy}
 */
export function resolveStripeConnectSetupPresentation(account, copy) {
  const status = String(account?.onboarding_status ?? '').toLowerCase();
  const stripeId = account?.stripe_account_id;

  if (status === 'restricted') {
    return {
      title: copy.title,
      description: copy.body,
      buttonTitle: copy.cta,
    };
  }

  if (!stripeId) {
    return {
      title: 'Set up payments',
      description: STRIPE_CONNECT_SETUP_MARKETING_DESCRIPTION,
      buttonTitle: 'Connect with Stripe',
    };
  }

  return {
    title: 'Set up payments',
    description: 'Finish onboarding in Stripe to enable payouts.',
    buttonTitle: copy.cta,
  };
}

/**
 * UX lines for Pro Stripe Connect setup (matches resume vs first-time flavor).
 *
 * @param {{ stripe_account_id?: string | null; onboarding_status?: string | null } | null | undefined} account
 * @returns {{ title: string; body: string; cta: string }}
 */
export function getStripeConnectSetupCopy(account) {
  const stripeId = account?.stripe_account_id;
  const status = String(account?.onboarding_status ?? '').toLowerCase();

  if (!stripeId) {
    return {
      title: 'Get started with Stripe',
      body: 'Connect a Stripe account to accept booking payments through ServiceLink. It only takes a few minutes.',
      cta: 'Continue with Stripe',
    };
  }

  if (status === 'restricted') {
    return {
      title: 'Stripe needs attention',
      body: 'Your connected account has restrictions. Continue in Stripe to finish verification or resolve outstanding requirements.',
      cta: 'Continue in Stripe',
    };
  }

  return {
    title: 'Finish Stripe setup',
    body: 'You started connecting Stripe but onboarding is not complete yet. Pick up where you left off.',
    cta: 'Resume Stripe setup',
  };
}

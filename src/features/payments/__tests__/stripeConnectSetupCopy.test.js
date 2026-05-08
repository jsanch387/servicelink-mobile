import {
  getStripeConnectSetupCopy,
  resolveStripeConnectSetupPresentation,
} from '../utils/stripeConnectSetupCopy';

describe('resolveStripeConnectSetupPresentation', () => {
  it('uses marketing title and Connect with Stripe for first-time', () => {
    const copy = getStripeConnectSetupCopy(null);
    const pres = resolveStripeConnectSetupPresentation(null, copy);
    expect(pres.title).toBe('Set up payments');
    expect(pres.buttonTitle).toBe('Connect with Stripe');
    expect(pres.description).toMatch(/secure payment setup with stripe/i);
  });

  it('uses restricted headline from copy', () => {
    const account = { stripe_account_id: 'acct_1', onboarding_status: 'restricted' };
    const copy = getStripeConnectSetupCopy(account);
    const pres = resolveStripeConnectSetupPresentation(account, copy);
    expect(pres.title).toBe('Stripe needs attention');
    expect(pres.buttonTitle).toBe('Continue in Stripe');
  });

  it('keeps Set up payments headline for resume but uses copy body + CTA', () => {
    const account = { stripe_account_id: 'acct_1', onboarding_status: 'in_progress' };
    const copy = getStripeConnectSetupCopy(account);
    const pres = resolveStripeConnectSetupPresentation(account, copy);
    expect(pres.title).toBe('Set up payments');
    expect(pres.description).toBe('Finish onboarding in Stripe to enable payouts.');
    expect(pres.buttonTitle).toBe('Resume Stripe setup');
  });
});

describe('getStripeConnectSetupCopy', () => {
  it('first-time copy when no stripe_account_id', () => {
    expect(getStripeConnectSetupCopy(null).cta).toBe('Continue with Stripe');
    expect(getStripeConnectSetupCopy({ stripe_account_id: null }).title).toBe(
      'Get started with Stripe',
    );
  });

  it('resume copy when account exists and in progress', () => {
    const out = getStripeConnectSetupCopy({
      stripe_account_id: 'acct_123',
      onboarding_status: 'in_progress',
    });
    expect(out.title).toBe('Finish Stripe setup');
    expect(out.cta).toBe('Resume Stripe setup');
  });

  it('restricted messaging', () => {
    const out = getStripeConnectSetupCopy({
      stripe_account_id: 'acct_123',
      onboarding_status: 'restricted',
    });
    expect(out.title).toBe('Stripe needs attention');
    expect(out.cta).toBe('Continue in Stripe');
  });
});

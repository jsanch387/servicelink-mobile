import {
  getSubscriptionAccessLine,
  getSubscriptionHeaderBadge,
  getSubscriptionPlanLabel,
} from '../utils/subscriptionPresentation';

describe('subscriptionPresentation', () => {
  const futureDate = '2026-05-15T12:00:00.000Z';

  it('shows canceled badge when pro + cancel-at-period-end', () => {
    const row = {
      subscription_tier: 'pro',
      subscription_status: 'active',
      subscription_current_period_end: futureDate,
      subscription_cancel_at_period_end: true,
      stripe_subscription_id: 'sub_123',
      stripe_customer_id: 'cus_123',
    };

    expect(getSubscriptionPlanLabel(row)).toBe('Pro');
    expect(getSubscriptionHeaderBadge(row)).toBe('Canceled');
    expect(getSubscriptionAccessLine(row)).toMatch(/^Pro access until /);
  });

  it('shows trial copy before cancel/renew copy', () => {
    const row = {
      subscription_tier: 'pro',
      subscription_status: 'trialing',
      subscription_current_period_end: futureDate,
      subscription_cancel_at_period_end: false,
      stripe_subscription_id: 'sub_123',
      stripe_customer_id: 'cus_123',
    };

    expect(getSubscriptionHeaderBadge(row)).toBeNull();
    expect(getSubscriptionAccessLine(row)).toMatch(/^Trial ends on /);
  });

  it('shows renews copy for active non-canceling subscription', () => {
    const row = {
      subscription_tier: 'pro',
      subscription_status: 'active',
      subscription_current_period_end: futureDate,
      subscription_cancel_at_period_end: false,
      stripe_subscription_id: 'sub_123',
      stripe_customer_id: 'cus_123',
    };

    expect(getSubscriptionHeaderBadge(row)).toBeNull();
    expect(getSubscriptionAccessLine(row)).toMatch(/^Renews on /);
  });

  it('returns no date line when period end is invalid', () => {
    const row = {
      subscription_tier: 'pro',
      subscription_status: 'active',
      subscription_current_period_end: 'invalid-date',
      subscription_cancel_at_period_end: false,
      stripe_subscription_id: 'sub_123',
      stripe_customer_id: 'cus_123',
    };

    expect(getSubscriptionAccessLine(row)).toBeNull();
  });
});

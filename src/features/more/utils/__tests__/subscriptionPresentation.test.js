import {
  hasOwnerSubscriptionPaymentFailed,
  hasProAccessFromProfile,
  isProAccess,
  ownerPaymentFailedNoticeEpisodeKey,
} from '../subscriptionPresentation';

describe('isProAccess / hasProAccessFromProfile (web-aligned)', () => {
  it('explicit free tier → not Pro regardless of Stripe remnants', () => {
    expect(isProAccess('free', null, 'canceled', 'sub_x', 'cus_x')).toBe(false);
    expect(
      hasProAccessFromProfile({
        subscription_tier: 'free',
        stripe_subscription_id: 'sub_1',
        stripe_customer_id: 'cus_1',
        subscription_status: 'active',
      }),
    ).toBe(false);
  });

  it('comped Pro: pro tier, no stripe customer, no subscription id', () => {
    expect(isProAccess('pro', null, null, '', '')).toBe(true);
    expect(
      hasProAccessFromProfile({
        subscription_tier: 'pro',
        stripe_subscription_id: null,
        stripe_customer_id: null,
        subscription_status: null,
      }),
    ).toBe(true);
  });

  it('pro tier with customer id but no subscription id → not comped, not Pro', () => {
    expect(isProAccess('pro', null, '', '', 'cus_123')).toBe(false);
    expect(
      hasProAccessFromProfile({
        subscription_tier: 'pro',
        stripe_subscription_id: '',
        stripe_customer_id: 'cus_123',
      }),
    ).toBe(false);
  });

  it('billed: pro tier + subscription id + active → Pro', () => {
    expect(isProAccess('pro', null, 'active', 'sub_1', 'cus_1')).toBe(true);
  });

  it('billed: pro tier + subscription id + trialing → Pro', () => {
    expect(isProAccess('pro', null, 'trialing', 'sub_1', 'cus_1')).toBe(true);
  });

  it('billed: pro tier + subscription id + empty status (grace) → Pro', () => {
    expect(isProAccess('pro', null, '', 'sub_1', 'cus_1')).toBe(true);
    expect(isProAccess('pro', null, null, 'sub_1', 'cus_1')).toBe(true);
  });

  it('billed: pro tier but canceled → not Pro', () => {
    expect(isProAccess('pro', null, 'canceled', 'sub_1', 'cus_1')).toBe(false);
  });

  it('billed: pro tier but past_due → not Pro', () => {
    expect(isProAccess('pro', null, 'past_due', 'sub_1', 'cus_1')).toBe(false);
  });

  it('subscription id without pro tier → not Pro', () => {
    expect(isProAccess('free', null, 'active', 'sub_1', 'cus_1')).toBe(false);
  });

  it('detects billed Pro payment failed (past_due / unpaid)', () => {
    expect(
      hasOwnerSubscriptionPaymentFailed({
        subscription_tier: 'pro',
        subscription_status: 'past_due',
        stripe_subscription_id: 'sub_1',
      }),
    ).toBe(true);
    expect(
      hasOwnerSubscriptionPaymentFailed({
        subscription_tier: 'pro',
        subscription_status: 'unpaid',
        stripe_subscription_id: 'sub_1',
      }),
    ).toBe(true);
    expect(
      hasOwnerSubscriptionPaymentFailed({
        subscription_tier: 'free',
        subscription_status: 'past_due',
        stripe_subscription_id: 'sub_1',
      }),
    ).toBe(true);
  });

  it('does not treat active, canceled, or never-billed as payment failed', () => {
    expect(
      hasOwnerSubscriptionPaymentFailed({
        subscription_tier: 'pro',
        subscription_status: 'active',
        stripe_subscription_id: 'sub_1',
      }),
    ).toBe(false);
    expect(
      hasOwnerSubscriptionPaymentFailed({
        subscription_tier: 'pro',
        subscription_status: 'canceled',
        stripe_subscription_id: 'sub_1',
      }),
    ).toBe(false);
    expect(
      hasOwnerSubscriptionPaymentFailed({
        subscription_tier: 'pro',
        subscription_status: 'past_due',
        stripe_subscription_id: '',
      }),
    ).toBe(false);
  });

  it('keys a payment-failed episode by subscription, status, and period end', () => {
    expect(
      ownerPaymentFailedNoticeEpisodeKey({
        subscription_status: 'past_due',
        stripe_subscription_id: 'sub_1',
        subscription_current_period_end: '2026-09-01T00:00:00.000Z',
      }),
    ).toBe('sub_1:past_due:2026-09-01T00:00:00.000Z');
    expect(
      ownerPaymentFailedNoticeEpisodeKey({
        subscription_status: 'active',
        stripe_subscription_id: 'sub_1',
      }),
    ).toBe('');
  });

  it('ignores period end for access (web: status is SoT)', () => {
    const past = '2020-01-01T00:00:00.000Z';
    const future = '2030-01-01T00:00:00.000Z';
    expect(isProAccess('pro', past, 'active', 'sub_1', 'cus_1')).toBe(true);
    expect(isProAccess('pro', future, 'canceled', 'sub_1', 'cus_1')).toBe(false);
  });
});

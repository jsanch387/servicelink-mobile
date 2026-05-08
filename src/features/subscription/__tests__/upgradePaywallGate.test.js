import {
  shouldShowFullScreenSubscriptionPaywall,
  shouldShowUpgradePaywallFromProfile,
  shouldUseUpgradePaywallHomeTab,
} from '../upgradePaywallGate';

describe('upgradePaywallGate', () => {
  const futureDate = '2026-05-15T12:00:00.000Z';

  it('shouldShowUpgradePaywallFromProfile is false when tier is pro', () => {
    expect(
      shouldShowUpgradePaywallFromProfile({
        subscription_tier: 'pro',
        subscription_status: 'active',
        subscription_current_period_end: futureDate,
        stripe_subscription_id: 'sub_123',
        stripe_customer_id: 'cus_123',
      }),
    ).toBe(false);
  });

  it('shouldShowUpgradePaywallFromProfile is true for free tier without valid Stripe window', () => {
    expect(
      shouldShowUpgradePaywallFromProfile({
        subscription_tier: 'free',
        subscription_status: 'active',
        subscription_current_period_end: futureDate,
        stripe_subscription_id: '',
        stripe_customer_id: 'cus_123',
      }),
    ).toBe(true);
  });

  it('shouldUseUpgradePaywallHomeTab is false until profile bundle has loaded', () => {
    expect(
      shouldUseUpgradePaywallHomeTab({
        isOwnerProfileLoaded: false,
        hasProAccess: false,
      }),
    ).toBe(false);
  });

  it('shouldUseUpgradePaywallHomeTab is true when loaded and no pro access', () => {
    expect(
      shouldUseUpgradePaywallHomeTab({
        isOwnerProfileLoaded: true,
        hasProAccess: false,
      }),
    ).toBe(true);
  });

  it('shouldUseUpgradePaywallHomeTab is false when loaded and user has pro access', () => {
    expect(
      shouldUseUpgradePaywallHomeTab({
        isOwnerProfileLoaded: true,
        hasProAccess: true,
      }),
    ).toBe(false);
  });

  it('shouldShowFullScreenSubscriptionPaywall matches shouldUseUpgradePaywallHomeTab', () => {
    const cases = [
      { isOwnerProfileLoaded: false, hasProAccess: false },
      { isOwnerProfileLoaded: true, hasProAccess: false },
      { isOwnerProfileLoaded: true, hasProAccess: true },
    ];
    for (const args of cases) {
      expect(shouldShowFullScreenSubscriptionPaywall(args)).toBe(
        shouldUseUpgradePaywallHomeTab(args),
      );
    }
  });
});

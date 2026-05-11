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

  it('shouldUseUpgradePaywallHomeTab is false until paywall data is stable', () => {
    expect(
      shouldUseUpgradePaywallHomeTab({
        isPaywallDataStable: false,
        hasProAccess: false,
      }),
    ).toBe(false);
  });

  it('shouldUseUpgradePaywallHomeTab is true when stable and no pro access', () => {
    expect(
      shouldUseUpgradePaywallHomeTab({
        isPaywallDataStable: true,
        hasProAccess: false,
      }),
    ).toBe(true);
  });

  it('shouldUseUpgradePaywallHomeTab is false when stable and user has pro access', () => {
    expect(
      shouldUseUpgradePaywallHomeTab({
        isPaywallDataStable: true,
        hasProAccess: true,
      }),
    ).toBe(false);
  });

  it('does not show paywall when data is not stable (e.g. account refetch after onboarding)', () => {
    expect(
      shouldShowFullScreenSubscriptionPaywall({
        isPaywallDataStable: false,
        hasProAccess: false,
      }),
    ).toBe(false);
  });

  it('shouldShowFullScreenSubscriptionPaywall matches shouldUseUpgradePaywallHomeTab', () => {
    const cases = [
      { isPaywallDataStable: false, hasProAccess: false },
      { isPaywallDataStable: true, hasProAccess: false },
      { isPaywallDataStable: true, hasProAccess: true },
    ];
    for (const args of cases) {
      expect(shouldShowFullScreenSubscriptionPaywall(args)).toBe(
        shouldUseUpgradePaywallHomeTab(args),
      );
    }
  });
});

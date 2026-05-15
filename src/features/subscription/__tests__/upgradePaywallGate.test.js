import {
  ENABLE_FULL_SCREEN_UPGRADE_PAYWALL,
  shouldShowFullScreenSubscriptionPaywall,
  shouldShowUpgradePaywallFromProfile,
  shouldUseUpgradePaywallHomeTab,
} from '../upgradePaywallGate';

describe('upgradePaywallGate', () => {
  const churnedOwner = {
    subscription_tier: 'free',
    subscription_status: 'canceled',
    stripe_customer_id: 'cus_legacy',
    stripe_subscription_id: '',
  };

  it('ENABLE_FULL_SCREEN_UPGRADE_PAYWALL is on for cohort-B parity', () => {
    expect(ENABLE_FULL_SCREEN_UPGRADE_PAYWALL).toBe(true);
  });

  it('shouldShowUpgradePaywallFromProfile is false when tier is pro', () => {
    expect(
      shouldShowUpgradePaywallFromProfile({
        subscription_tier: 'pro',
        subscription_status: 'active',
        stripe_subscription_id: 'sub_123',
        stripe_customer_id: 'cus_123',
      }),
    ).toBe(false);
  });

  it('shouldShowUpgradePaywallFromProfile is true for explicit free tier', () => {
    expect(
      shouldShowUpgradePaywallFromProfile({
        subscription_tier: 'free',
        subscription_status: 'active',
        stripe_subscription_id: '',
        stripe_customer_id: 'cus_123',
      }),
    ).toBe(true);
  });

  it('never-billed Free: full-screen paywall off even without Pro when data is stable', () => {
    expect(
      shouldShowFullScreenSubscriptionPaywall({
        isPaywallDataStable: true,
        hasProAccess: false,
        ownerProfile: null,
      }),
    ).toBe(false);
    expect(
      shouldShowFullScreenSubscriptionPaywall({
        isPaywallDataStable: true,
        hasProAccess: false,
        ownerProfile: {},
      }),
    ).toBe(false);
  });

  it('explicit free tier + prior Stripe (canceled) → no full-screen paywall when stable', () => {
    expect(
      shouldShowFullScreenSubscriptionPaywall({
        isPaywallDataStable: true,
        hasProAccess: false,
        ownerProfile: churnedOwner,
      }),
    ).toBe(false);
  });

  it('pro tier + canceled + Stripe ids + not Pro → full-screen paywall when stable', () => {
    expect(
      shouldShowFullScreenSubscriptionPaywall({
        isPaywallDataStable: true,
        hasProAccess: false,
        ownerProfile: {
          subscription_tier: 'pro',
          subscription_status: 'canceled',
          stripe_subscription_id: 'sub_dead',
          stripe_customer_id: 'cus_1',
        },
      }),
    ).toBe(true);
  });

  it('shouldUseUpgradePaywallHomeTab matches shouldShowFullScreenSubscriptionPaywall', () => {
    const cases = [
      { isPaywallDataStable: false, hasProAccess: false, ownerProfile: churnedOwner },
      { isPaywallDataStable: true, hasProAccess: false, ownerProfile: null },
      { isPaywallDataStable: true, hasProAccess: false, ownerProfile: churnedOwner },
      { isPaywallDataStable: true, hasProAccess: true, ownerProfile: churnedOwner },
    ];
    for (const args of cases) {
      expect(shouldShowFullScreenSubscriptionPaywall(args)).toBe(
        shouldUseUpgradePaywallHomeTab(args),
      );
    }
  });

  it('does not show paywall until subscription bundle is stable', () => {
    expect(
      shouldShowFullScreenSubscriptionPaywall({
        isPaywallDataStable: false,
        hasProAccess: false,
        ownerProfile: churnedOwner,
      }),
    ).toBe(false);
  });

  it('no paywall when user still has Pro (e.g. trialing)', () => {
    expect(
      shouldShowFullScreenSubscriptionPaywall({
        isPaywallDataStable: true,
        hasProAccess: true,
        ownerProfile: churnedOwner,
      }),
    ).toBe(false);
  });
});

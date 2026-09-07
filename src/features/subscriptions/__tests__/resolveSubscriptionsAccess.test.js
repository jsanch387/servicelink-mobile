import { SUBSCRIPTIONS_EARLY_ACCESS_EMAILS } from '../constants/subscriptionsFeatureFlags';
import {
  isSubscriptionsEarlyAccessEmail,
  resolveSubscriptionsAccess,
} from '../utils/resolveSubscriptionsAccess';

describe('rollout allowlist', () => {
  it('is empty so Subscriptions is open to every login', () => {
    expect(SUBSCRIPTIONS_EARLY_ACCESS_EMAILS).toEqual([]);
  });
});

describe('resolveSubscriptionsAccess', () => {
  it('disables everything when the master flag is off', () => {
    expect(
      resolveSubscriptionsAccess({
        enabled: false,
        hasProAccess: true,
        email: 'owner@example.com',
        profileLoaded: true,
      }),
    ).toEqual({
      featureEnabled: false,
      canUseSubscriptions: false,
      showUpsell: false,
      isReady: true,
    });
  });

  describe('open rollout (default — allowlist empty)', () => {
    it('allows Pro when profile is loaded', () => {
      expect(
        resolveSubscriptionsAccess({
          enabled: true,
          hasProAccess: true,
          email: 'owner@example.com',
          profileLoaded: true,
        }),
      ).toEqual({
        featureEnabled: true,
        canUseSubscriptions: true,
        showUpsell: false,
        isReady: true,
      });
    });

    it('shows upsell for non-Pro when ready', () => {
      expect(
        resolveSubscriptionsAccess({
          enabled: true,
          hasProAccess: false,
          email: 'free@example.com',
          profileLoaded: true,
        }),
      ).toEqual({
        featureEnabled: true,
        canUseSubscriptions: false,
        showUpsell: true,
        isReady: true,
      });
    });

    it('waits for profile before showing Pro or upsell', () => {
      expect(
        resolveSubscriptionsAccess({
          enabled: true,
          hasProAccess: false,
          email: 'owner@example.com',
          profileLoaded: false,
        }),
      ).toEqual({
        featureEnabled: true,
        canUseSubscriptions: false,
        showUpsell: false,
        isReady: false,
      });
    });
  });

  describe('restrictToEarlyAccess override', () => {
    it('hides the feature when restrict is on and the allowlist is empty', () => {
      expect(
        resolveSubscriptionsAccess({
          enabled: true,
          hasProAccess: true,
          email: 'owner@example.com',
          profileLoaded: true,
          restrictToEarlyAccess: true,
        }),
      ).toEqual({
        featureEnabled: false,
        canUseSubscriptions: false,
        showUpsell: false,
        isReady: true,
      });
    });
  });
});

describe('isSubscriptionsEarlyAccessEmail', () => {
  it('matches nobody while the allowlist is empty', () => {
    expect(isSubscriptionsEarlyAccessEmail('owner@example.com')).toBe(false);
    expect(isSubscriptionsEarlyAccessEmail('jesuss387@gmail.com')).toBe(false);
  });
});

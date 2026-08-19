import { SUBSCRIPTIONS_EARLY_ACCESS_EMAILS } from '../constants/subscriptionsFeatureFlags';
import {
  isSubscriptionsEarlyAccessEmail,
  resolveSubscriptionsAccess,
} from '../utils/resolveSubscriptionsAccess';

describe('closed-testing allowlist', () => {
  it('includes only the two owner emails', () => {
    expect([...SUBSCRIPTIONS_EARLY_ACCESS_EMAILS].map((e) => e.toLowerCase()).sort()).toEqual([
      'jesuss387@gmail.com',
      'urbanink.help@gmail.com',
    ]);
  });
});

describe('resolveSubscriptionsAccess', () => {
  it('disables everything when the master flag is off', () => {
    expect(
      resolveSubscriptionsAccess({
        enabled: false,
        hasProAccess: true,
        email: 'urbanink.help@gmail.com',
        profileLoaded: true,
      }),
    ).toEqual({
      featureEnabled: false,
      canUseSubscriptions: false,
      showUpsell: false,
      isReady: true,
    });
  });

  it('allows early-access email without Pro', () => {
    expect(
      resolveSubscriptionsAccess({
        enabled: true,
        hasProAccess: false,
        email: 'UrbanInk.Help@gmail.com',
        profileLoaded: true,
      }),
    ).toEqual({
      featureEnabled: true,
      canUseSubscriptions: true,
      showUpsell: false,
      isReady: true,
    });
  });

  describe('phase 1 — allowlist populated (defaults to restrictToEarlyAccess)', () => {
    it('hides the feature from Pro subscribers not on the allowlist', () => {
      expect(
        resolveSubscriptionsAccess({
          enabled: true,
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

    it('hides the upsell from non-Pro users not on the allowlist', () => {
      expect(
        resolveSubscriptionsAccess({
          enabled: true,
          hasProAccess: false,
          email: 'free@example.com',
          profileLoaded: true,
        }),
      ).toEqual({
        featureEnabled: false,
        canUseSubscriptions: false,
        showUpsell: false,
        isReady: true,
      });
    });
  });

  describe('phase 2 — allowlist cleared (restrictToEarlyAccess: false)', () => {
    it('allows Pro when profile is loaded', () => {
      expect(
        resolveSubscriptionsAccess({
          enabled: true,
          hasProAccess: true,
          email: 'owner@example.com',
          profileLoaded: true,
          restrictToEarlyAccess: false,
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
          restrictToEarlyAccess: false,
        }),
      ).toEqual({
        featureEnabled: true,
        canUseSubscriptions: false,
        showUpsell: true,
        isReady: true,
      });
    });
  });
});

describe('isSubscriptionsEarlyAccessEmail', () => {
  it('matches allowlisted emails case-insensitively', () => {
    expect(isSubscriptionsEarlyAccessEmail('jesuss387@gmail.com')).toBe(true);
    expect(isSubscriptionsEarlyAccessEmail('Jesuss387@Gmail.com')).toBe(true);
    expect(isSubscriptionsEarlyAccessEmail('other@example.com')).toBe(false);
  });
});

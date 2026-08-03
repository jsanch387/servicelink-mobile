import {
  isCustomerSmsEarlyAccessEmail,
  resolveCustomerSmsAccess,
} from '../utils/resolveCustomerSmsAccess';

jest.mock('../constants/customerSmsFlags', () => ({
  CUSTOMER_SMS_ENABLED: true,
  CUSTOMER_SMS_EARLY_ACCESS_EMAILS: ['early@example.com'],
}));

describe('resolveCustomerSmsAccess', () => {
  it('disables everything when the master flag is off', () => {
    expect(
      resolveCustomerSmsAccess({
        enabled: false,
        hasProAccess: true,
        email: 'early@example.com',
        profileLoaded: true,
      }),
    ).toEqual({
      featureEnabled: false,
      canUseSms: false,
      showUpsell: false,
      isReady: true,
    });
  });

  it('allows early-access email without Pro', () => {
    expect(
      resolveCustomerSmsAccess({
        enabled: true,
        hasProAccess: false,
        email: 'Early@Example.com',
        profileLoaded: true,
      }),
    ).toEqual({
      featureEnabled: true,
      canUseSms: true,
      showUpsell: false,
      isReady: true,
    });
  });

  describe('phase 1 — allowlist populated (defaults to restrictToEarlyAccess)', () => {
    it('hides the feature from Pro subscribers not on the allowlist', () => {
      expect(
        resolveCustomerSmsAccess({
          enabled: true,
          hasProAccess: true,
          email: 'owner@example.com',
          profileLoaded: true,
        }),
      ).toEqual({
        featureEnabled: false,
        canUseSms: false,
        showUpsell: false,
        isReady: true,
      });
    });

    it('hides the upsell from non-Pro users not on the allowlist', () => {
      expect(
        resolveCustomerSmsAccess({
          enabled: true,
          hasProAccess: false,
          email: 'free@example.com',
          profileLoaded: true,
        }),
      ).toEqual({
        featureEnabled: false,
        canUseSms: false,
        showUpsell: false,
        isReady: true,
      });
    });

    it('hides the feature even while the profile is still loading', () => {
      expect(
        resolveCustomerSmsAccess({
          enabled: true,
          hasProAccess: false,
          email: 'free@example.com',
          profileLoaded: false,
        }),
      ).toEqual({
        featureEnabled: false,
        canUseSms: false,
        showUpsell: false,
        isReady: true,
      });
    });
  });

  describe('phase 2 — allowlist cleared (restrictToEarlyAccess: false)', () => {
    it('allows Pro when profile is loaded', () => {
      expect(
        resolveCustomerSmsAccess({
          enabled: true,
          hasProAccess: true,
          email: 'owner@example.com',
          profileLoaded: true,
          restrictToEarlyAccess: false,
        }),
      ).toEqual({
        featureEnabled: true,
        canUseSms: true,
        showUpsell: false,
        isReady: true,
      });
    });

    it('shows upsell for non-Pro when ready', () => {
      expect(
        resolveCustomerSmsAccess({
          enabled: true,
          hasProAccess: false,
          email: 'free@example.com',
          profileLoaded: true,
          restrictToEarlyAccess: false,
        }),
      ).toEqual({
        featureEnabled: true,
        canUseSms: false,
        showUpsell: true,
        isReady: true,
      });
    });

    it('waits for profile before upsell or Pro grant', () => {
      expect(
        resolveCustomerSmsAccess({
          enabled: true,
          hasProAccess: false,
          email: 'free@example.com',
          profileLoaded: false,
          restrictToEarlyAccess: false,
        }),
      ).toEqual({
        featureEnabled: true,
        canUseSms: false,
        showUpsell: false,
        isReady: false,
      });
    });
  });
});

describe('isCustomerSmsEarlyAccessEmail', () => {
  it('matches allowlisted emails case-insensitively', () => {
    expect(isCustomerSmsEarlyAccessEmail('early@example.com')).toBe(true);
    expect(isCustomerSmsEarlyAccessEmail('EARLY@example.com')).toBe(true);
    expect(isCustomerSmsEarlyAccessEmail('other@example.com')).toBe(false);
  });
});

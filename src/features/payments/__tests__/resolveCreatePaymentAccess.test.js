import { CREATE_PAYMENT_EARLY_ACCESS_EMAILS } from '../create-payment/constants/createPaymentFeatureFlags';
import {
  isCreatePaymentEarlyAccessEmail,
  resolveCreatePaymentAccess,
} from '../create-payment/utils/resolveCreatePaymentAccess';

describe('closed-testing allowlist', () => {
  it('includes only the two owner emails', () => {
    expect([...CREATE_PAYMENT_EARLY_ACCESS_EMAILS].map((e) => e.toLowerCase()).sort()).toEqual([
      'jesuss387@gmail.com',
      'urbanink.help@gmail.com',
    ]);
  });
});

describe('resolveCreatePaymentAccess', () => {
  it('disables everything when the master flag is off', () => {
    expect(
      resolveCreatePaymentAccess({
        enabled: false,
        hasProAccess: true,
        email: 'urbanink.help@gmail.com',
        profileLoaded: true,
      }),
    ).toEqual({
      featureEnabled: false,
      canUseCreatePayment: false,
      showUpsell: false,
      isReady: true,
    });
  });

  describe('phase 1 — allowlist populated (defaults to restrictToEarlyAccess)', () => {
    it('hides the feature from Pro subscribers not on the allowlist', () => {
      expect(
        resolveCreatePaymentAccess({
          enabled: true,
          hasProAccess: true,
          email: 'owner@example.com',
          profileLoaded: true,
        }),
      ).toEqual({
        featureEnabled: false,
        canUseCreatePayment: false,
        showUpsell: false,
        isReady: true,
      });
    });

    it('lets an allowlisted Pro owner use Create payment', () => {
      expect(
        resolveCreatePaymentAccess({
          enabled: true,
          hasProAccess: true,
          email: 'UrbanInk.Help@gmail.com',
          profileLoaded: true,
        }),
      ).toEqual({
        featureEnabled: true,
        canUseCreatePayment: true,
        showUpsell: false,
        isReady: true,
      });
    });

    it('shows the web upsell for an allowlisted owner who is not Pro', () => {
      expect(
        resolveCreatePaymentAccess({
          enabled: true,
          hasProAccess: false,
          email: 'jesuss387@gmail.com',
          profileLoaded: true,
        }),
      ).toEqual({
        featureEnabled: true,
        canUseCreatePayment: false,
        showUpsell: true,
        isReady: true,
      });
    });
  });

  describe('phase 2 — allowlist cleared (restrictToEarlyAccess: false)', () => {
    it('allows Pro when profile is loaded', () => {
      expect(
        resolveCreatePaymentAccess({
          enabled: true,
          hasProAccess: true,
          email: 'owner@example.com',
          profileLoaded: true,
          restrictToEarlyAccess: false,
        }),
      ).toEqual({
        featureEnabled: true,
        canUseCreatePayment: true,
        showUpsell: false,
        isReady: true,
      });
    });

    it('shows upsell for non-Pro when ready', () => {
      expect(
        resolveCreatePaymentAccess({
          enabled: true,
          hasProAccess: false,
          email: 'free@example.com',
          profileLoaded: true,
          restrictToEarlyAccess: false,
        }),
      ).toEqual({
        featureEnabled: true,
        canUseCreatePayment: false,
        showUpsell: true,
        isReady: true,
      });
    });
  });
});

describe('isCreatePaymentEarlyAccessEmail', () => {
  it('matches allowlisted emails case-insensitively', () => {
    expect(isCreatePaymentEarlyAccessEmail('jesuss387@gmail.com')).toBe(true);
    expect(isCreatePaymentEarlyAccessEmail('Jesuss387@Gmail.com')).toBe(true);
    expect(isCreatePaymentEarlyAccessEmail('other@example.com')).toBe(false);
  });
});

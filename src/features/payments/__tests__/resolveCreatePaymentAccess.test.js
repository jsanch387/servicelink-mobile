import { CREATE_PAYMENT_EARLY_ACCESS_EMAILS } from '../create-payment/constants/createPaymentFeatureFlags';
import {
  isCreatePaymentEarlyAccessEmail,
  resolveCreatePaymentAccess,
} from '../create-payment/utils/resolveCreatePaymentAccess';

describe('rollout allowlist', () => {
  it('is empty so Create payment is open to every login', () => {
    expect(CREATE_PAYMENT_EARLY_ACCESS_EMAILS).toEqual([]);
  });
});

describe('resolveCreatePaymentAccess', () => {
  it('disables everything when the master flag is off', () => {
    expect(
      resolveCreatePaymentAccess({
        enabled: false,
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

  describe('open rollout (default — allowlist empty)', () => {
    it('allows Pro when profile is loaded', () => {
      expect(
        resolveCreatePaymentAccess({
          enabled: true,
          hasProAccess: true,
          email: 'owner@example.com',
          profileLoaded: true,
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
        }),
      ).toEqual({
        featureEnabled: true,
        canUseCreatePayment: false,
        showUpsell: true,
        isReady: true,
      });
    });
  });

  describe('restrictToEarlyAccess override', () => {
    it('hides the feature when restrict is on and the allowlist is empty', () => {
      expect(
        resolveCreatePaymentAccess({
          enabled: true,
          hasProAccess: true,
          email: 'owner@example.com',
          profileLoaded: true,
          restrictToEarlyAccess: true,
        }),
      ).toEqual({
        featureEnabled: false,
        canUseCreatePayment: false,
        showUpsell: false,
        isReady: true,
      });
    });
  });
});

describe('isCreatePaymentEarlyAccessEmail', () => {
  it('matches nobody while the allowlist is empty', () => {
    expect(isCreatePaymentEarlyAccessEmail('owner@example.com')).toBe(false);
    expect(isCreatePaymentEarlyAccessEmail('jesuss387@gmail.com')).toBe(false);
  });
});

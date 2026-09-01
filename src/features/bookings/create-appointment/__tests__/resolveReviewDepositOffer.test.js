import { DEPOSIT_AMOUNT_MODE } from '../../../payments/constants/depositAmount';
import {
  REVIEW_PAYMENT_CHOICE,
  resolveReviewDepositOffer,
} from '../utils/resolveReviewDepositOffer';

function hydration(overrides = {}) {
  return {
    paymentsEnabled: true,
    requireDeposits: true,
    depositMode: DEPOSIT_AMOUNT_MODE.FIXED,
    depositAmount: '50',
    ...overrides,
  };
}

describe('resolveReviewDepositOffer', () => {
  it('offers a fixed deposit when payments and deposits are on', () => {
    expect(
      resolveReviewDepositOffer({
        formHydration: hydration(),
        stripeConnectReady: true,
        isMembershipVisit: false,
        totalUsd: 200,
      }),
    ).toEqual({ visible: true, depositUsd: 50 });
  });

  it('computes a percentage of the visit total', () => {
    expect(
      resolveReviewDepositOffer({
        formHydration: hydration({
          depositMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
          depositAmount: '20',
        }),
        stripeConnectReady: true,
        isMembershipVisit: false,
        totalUsd: 187,
      }),
    ).toEqual({ visible: true, depositUsd: 37.4 });
  });

  it('caps a fixed deposit at the visit total', () => {
    expect(
      resolveReviewDepositOffer({
        formHydration: hydration({ depositAmount: '300' }),
        stripeConnectReady: true,
        isMembershipVisit: false,
        totalUsd: 120,
      }),
    ).toEqual({ visible: true, depositUsd: 120 });
  });

  it('hides when deposits are off', () => {
    expect(
      resolveReviewDepositOffer({
        formHydration: hydration({ requireDeposits: false }),
        stripeConnectReady: true,
        isMembershipVisit: false,
        totalUsd: 200,
      }).visible,
    ).toBe(false);
  });

  it('hides when payments are off, Stripe is not ready, or this is a membership visit', () => {
    const base = {
      formHydration: hydration(),
      stripeConnectReady: true,
      isMembershipVisit: false,
      totalUsd: 200,
    };
    expect(
      resolveReviewDepositOffer({ ...base, formHydration: hydration({ paymentsEnabled: false }) })
        .visible,
    ).toBe(false);
    expect(resolveReviewDepositOffer({ ...base, stripeConnectReady: false }).visible).toBe(false);
    expect(resolveReviewDepositOffer({ ...base, isMembershipVisit: true }).visible).toBe(false);
  });

  it('hides zero or below-minimum amounts', () => {
    expect(
      resolveReviewDepositOffer({
        formHydration: hydration({ depositAmount: '0' }),
        stripeConnectReady: true,
        isMembershipVisit: false,
        totalUsd: 200,
      }).visible,
    ).toBe(false);
    expect(
      resolveReviewDepositOffer({
        formHydration: hydration({
          depositMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
          depositAmount: '1',
        }),
        stripeConnectReady: true,
        isMembershipVisit: false,
        totalUsd: 20,
      }).visible,
    ).toBe(false);
  });
});

describe('REVIEW_PAYMENT_CHOICE', () => {
  it('exposes none and deposit', () => {
    expect(REVIEW_PAYMENT_CHOICE.NONE).toBe('none');
    expect(REVIEW_PAYMENT_CHOICE.DEPOSIT).toBe('deposit');
  });
});

import {
  buildCompleteVisitCheckoutFromSheetState,
  buildJobCompletedPayload,
  canSubmitJobCompletedCheckout,
  computeCompleteVisitAmountDueCents,
  dollarsToCents,
  mapSessionFeesToCents,
  resolveCompleteVisitSessionPayment,
} from '../utils/buildJobCompletedPayload';
import { BOOKING_ACTION } from '../../constants/jobStatus';

describe('buildJobCompletedPayload', () => {
  it('builds minimal job_completed when checkout is empty', () => {
    expect(
      buildJobCompletedPayload({
        sessionFees: [],
        sessionPayment: null,
      }),
    ).toEqual({ action: BOOKING_ACTION.JOB_COMPLETED });
  });

  it('maps session fees and in-person payment to cents', () => {
    expect(
      buildJobCompletedPayload({
        sessionFees: [{ label: 'Pet hair', amount: 25 }],
        sessionPayment: { method: 'cash', amount: 120, stripePaymentIntentId: null },
      }),
    ).toEqual({
      action: BOOKING_ACTION.JOB_COMPLETED,
      sessionFees: [{ label: 'Pet hair', amountCents: 2500 }],
      sessionPayment: { method: 'cash', amountCents: 12000 },
    });
  });

  it('includes stripePaymentIntentId for tap_to_pay', () => {
    expect(
      buildJobCompletedPayload({
        sessionFees: [],
        sessionPayment: {
          method: 'tap_to_pay',
          amount: 45.5,
          stripePaymentIntentId: 'pi_123',
        },
      }),
    ).toEqual({
      action: BOOKING_ACTION.JOB_COMPLETED,
      sessionPayment: {
        method: 'tap_to_pay',
        amountCents: 4550,
        stripePaymentIntentId: 'pi_123',
      },
    });
  });

  it('rejects tap_to_pay without stripe intent', () => {
    expect(() =>
      buildJobCompletedPayload({
        sessionFees: [],
        sessionPayment: { method: 'tap_to_pay', amount: 10, stripePaymentIntentId: null },
      }),
    ).toThrow(/Tap to Pay is not ready yet/);
  });

  it('maps sheet state to checkout', () => {
    expect(
      buildCompleteVisitCheckoutFromSheetState({
        adjustments: [{ label: 'Extra wax', amount: 15 }],
        tapToPayAmount: 0,
        inPersonPayment: { method: 'payment_app', amount: 80 },
        stripePaymentIntentId: null,
      }),
    ).toEqual({
      sessionFees: [{ label: 'Extra wax', amount: 15 }],
      sessionPayment: { method: 'payment_app', amount: 80, stripePaymentIntentId: null },
    });
  });

  it('prefers tap to pay over mark-as-paid when both are set', () => {
    expect(
      resolveCompleteVisitSessionPayment(50, { method: 'cash', amount: 50 }, 'pi_live'),
    ).toEqual({
      method: 'tap_to_pay',
      amount: 50,
      stripePaymentIntentId: 'pi_live',
    });
  });

  it('blocks mock tap to pay submit outside design preview', () => {
    expect(
      canSubmitJobCompletedCheckout({
        tapToPayAmount: 25,
        stripePaymentIntentId: null,
        isDesignPreview: false,
      }),
    ).toBe(false);
    expect(
      canSubmitJobCompletedCheckout({
        tapToPayAmount: 25,
        stripePaymentIntentId: 'pi_123',
        isDesignPreview: false,
      }),
    ).toBe(true);
  });

  it('matches server amount-due math in cents', () => {
    const sessionFees = mapSessionFeesToCents([{ label: 'Pet hair', amount: 25 }]);
    const sessionPaymentCents = dollarsToCents(120);

    expect(
      computeCompleteVisitAmountDueCents({
        servicePriceCents: 10000,
        addonDetails: [{ priceCents: 1500 }],
        sessionFees,
        paidOnlineCents: 2000,
        sessionPaymentAmountCents: sessionPaymentCents,
      }),
    ).toBe(0);

    expect(
      computeCompleteVisitAmountDueCents({
        servicePriceCents: 10000,
        addonDetails: [{ priceCents: 1500 }],
        sessionFees,
        paidOnlineCents: 2000,
        sessionPaymentAmountCents: 0,
      }),
    ).toBe(12000);

    expect(
      computeCompleteVisitAmountDueCents({
        servicePriceCents: 10000,
        addonDetails: [{ priceCents: 1500 }],
        sessionFees,
        paidOnlineCents: 2000,
        sessionPaymentAmountCents: 0,
        discountCents: 2300,
      }),
    ).toBe(9700);
  });
});

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

  it('sends a discount as kind discount with a positive amount', () => {
    expect(
      mapSessionFeesToCents([
        { label: 'Travel fee', amount: 20 },
        { label: 'Returning customer', amount: -10 },
        { label: 'Deposit', amount: 50, kind: 'discount' },
      ]),
    ).toEqual([
      { kind: 'fee', label: 'Travel fee', amountCents: 2000 },
      { kind: 'discount', label: 'Returning customer', amountCents: 1000 },
      { kind: 'discount', label: 'Deposit', amountCents: 5000 },
    ]);
  });

  it('maps session fees and in-person payment to cents', () => {
    expect(
      buildJobCompletedPayload({
        sessionFees: [{ label: 'Pet hair', amount: 25 }],
        sessionPayment: { method: 'cash', amount: 120, stripePaymentIntentId: null },
      }),
    ).toEqual({
      action: BOOKING_ACTION.JOB_COMPLETED,
      sessionFees: [{ kind: 'fee', label: 'Pet hair', amountCents: 2500 }],
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
      sessionFees: [{ label: 'Extra wax', amount: 15, kind: 'fee' }],
      sessionPayment: { method: 'payment_app', amount: 80, stripePaymentIntentId: null },
      tipCents: 0,
    });
  });

  it('sends tipCents with tap to pay and leaves it out of the fee lines', () => {
    expect(
      buildJobCompletedPayload({
        sessionFees: [{ label: 'Pet hair', amount: 25 }],
        sessionPayment: {
          method: 'tap_to_pay',
          amount: 120,
          stripePaymentIntentId: 'pi_123',
        },
        tipCents: 2000,
      }),
    ).toEqual({
      action: BOOKING_ACTION.JOB_COMPLETED,
      sessionFees: [{ kind: 'fee', label: 'Pet hair', amountCents: 2500 }],
      sessionPayment: {
        method: 'tap_to_pay',
        amountCents: 12000,
        stripePaymentIntentId: 'pi_123',
      },
      tipCents: 2000,
    });
  });

  it('does not send a tip on mark as paid', () => {
    expect(
      buildJobCompletedPayload({
        sessionFees: [],
        sessionPayment: { method: 'cash', amount: 80, stripePaymentIntentId: null },
        tipCents: 2000,
      }),
    ).toEqual({
      action: BOOKING_ACTION.JOB_COMPLETED,
      sessionPayment: { method: 'cash', amountCents: 8000 },
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

    expect(
      computeCompleteVisitAmountDueCents({
        servicePriceCents: 10000,
        addonDetails: [],
        sessionFees: [{ kind: 'discount', label: 'Deposit', amountCents: 5000 }],
        paidOnlineCents: 0,
        sessionPaymentAmountCents: 0,
      }),
    ).toBe(5000);

    expect(
      computeCompleteVisitAmountDueCents({
        servicePriceCents: 22500,
        addonDetails: [],
        sessionFees: [],
        paidOnlineCents: 0,
        sessionPaymentAmountCents: 0,
        jobDetails: [
          { serviceName: 'Full Detail', servicePriceCents: 22500 },
          { serviceName: 'Touch-up', servicePriceCents: 7500 },
        ],
      }),
    ).toBe(30000);

    // Legacy single-job edit: add-ons only on addon_details, empty on job_details.
    expect(
      computeCompleteVisitAmountDueCents({
        servicePriceCents: 21000,
        addonDetails: {
          addons: [
            { id: 'a1', name: 'Pet hair', priceCents: 2000 },
            { id: 'a2', name: 'Engine Bay', priceCents: 6500 },
          ],
        },
        sessionFees: [],
        paidOnlineCents: 0,
        sessionPaymentAmountCents: 0,
        discountCents: 2100,
        jobDetails: [
          {
            serviceName: 'Detail',
            servicePriceCents: 21000,
            selectedAddOns: [],
          },
        ],
      }),
    ).toBe(27400);
  });
});

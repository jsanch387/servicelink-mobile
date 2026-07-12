import { resolveBookingSessionFees } from '../utils/resolveBookingSessionFees';

describe('resolveBookingSessionFees', () => {
  it('prefers explicit session fee lines', () => {
    expect(
      resolveBookingSessionFees({
        sessionFeeLines: [{ id: 'f1', label: 'Extra vacuum', amount_cents: 1500 }],
        paymentSummary: { totalAmountCents: 11500, sessionFeesTotalCents: 1500 },
        servicePrice: 100,
        addOnsTotal: 0,
      }),
    ).toEqual([{ id: 'f1', name: 'Extra vacuum', price: 15 }]);
  });

  it('falls back to invoice snapshot fees', () => {
    expect(
      resolveBookingSessionFees({
        sessionFeeLines: [],
        invoiceSnapshot: {
          sessionFees: [{ label: 'Pet hair', amountCents: 2000 }],
        },
        servicePrice: 80,
        addOnsTotal: 0,
      }),
    ).toEqual([{ id: 'invoice-fee-1', name: 'Pet hair', price: 20 }]);
  });

  it('infers additional fees from payment total when line rows are missing', () => {
    expect(
      resolveBookingSessionFees({
        sessionFeeLines: [],
        paymentSummary: { totalAmountCents: 11500 },
        servicePrice: 100,
        addOnsTotal: 0,
      }),
    ).toEqual([{ id: 'inferred-session-fees', name: 'Additional fees', price: 15 }]);
  });

  it('infers additional fees from session payment amount above base due', () => {
    expect(
      resolveBookingSessionFees({
        sessionFeeLines: [],
        servicePrice: 100,
        addOnsTotal: 0,
        sessionPaymentAmountCents: 11500,
        paidOnlineCents: 0,
      }),
    ).toEqual([{ id: 'inferred-session-fees', name: 'Additional fees', price: 15 }]);
  });

  it('does not treat a sale discount gap as additional fees', () => {
    expect(
      resolveBookingSessionFees({
        sessionFeeLines: [],
        paymentSummary: { totalAmountCents: 8500, sessionFeesTotalCents: 0 },
        servicePrice: 85,
        addOnsTotal: 0,
        discountDollars: 25,
      }),
    ).toEqual([]);
  });

  it('still infers real fees when payment total is net plus fees', () => {
    expect(
      resolveBookingSessionFees({
        sessionFeeLines: [],
        paymentSummary: { totalAmountCents: 7000 },
        servicePrice: 85,
        addOnsTotal: 0,
        discountDollars: 25,
      }),
    ).toEqual([{ id: 'inferred-session-fees', name: 'Additional fees', price: 10 }]);
  });
});

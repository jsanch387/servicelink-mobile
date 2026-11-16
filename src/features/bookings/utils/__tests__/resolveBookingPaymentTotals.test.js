import {
  resolveBookingPaymentTotals,
  resolveBookingTaxCents,
} from '../resolveBookingPaymentTotals';

describe('resolveBookingPaymentTotals', () => {
  it('matches the server for a $300 booking at 7% and a deposit', () => {
    expect(
      resolveBookingPaymentTotals({
        taxableBaseCents: 30000,
        taxRateBps: 700,
        storedTaxCents: 2100,
        paidOnlineCents: 5000,
      }),
    ).toEqual({ taxCents: 2100, totalCents: 32100, remainingCents: 27100 });
  });

  it('subtracts session discounts and a session payment once', () => {
    expect(
      resolveBookingPaymentTotals({
        taxableBaseCents: 10000,
        taxRateBps: 0,
        sessionFeeCents: 1500,
        sessionDiscountCents: 5000,
        sessionPaymentCents: 2000,
      }),
    ).toEqual({ taxCents: 0, totalCents: 11500, remainingCents: 4500 });
  });

  it('keeps stored tax only when there is no rate, and skips membership visits', () => {
    expect(
      resolveBookingTaxCents({ taxableBaseCents: 8500, taxRateBps: 0, storedTaxCents: 191 }),
    ).toBe(191);
    expect(
      resolveBookingTaxCents({
        taxableBaseCents: 8500,
        taxRateBps: 225,
        storedTaxCents: 191,
        isMembershipVisit: true,
      }),
    ).toBe(0);
    expect(resolveBookingTaxCents({ taxableBaseCents: 10000, taxRateBps: 2501 })).toBe(0);
  });
});

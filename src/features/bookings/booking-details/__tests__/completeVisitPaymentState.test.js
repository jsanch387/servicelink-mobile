import {
  bookingHasCompleteVisitPaymentSummary,
  bookingNeedsCompleteVisitDetailsFetch,
  isCompleteVisitPaidInFullOnline,
} from '../utils/completeVisitPaymentState';

describe('completeVisitPaymentState', () => {
  it('bookingHasCompleteVisitPaymentSummary detects merged payment rows', () => {
    expect(
      bookingHasCompleteVisitPaymentSummary({ payment: { paidOnlineAmountCents: 5000 } }),
    ).toBe(true);
    expect(bookingHasCompleteVisitPaymentSummary({ payment: { remaining_amount_cents: 0 } })).toBe(
      true,
    );
    expect(bookingHasCompleteVisitPaymentSummary({ service_price_cents: 12000 })).toBe(false);
  });

  it('bookingNeedsCompleteVisitDetailsFetch when pricing or payment is missing', () => {
    expect(bookingNeedsCompleteVisitDetailsFetch(null)).toBe(true);
    expect(
      bookingNeedsCompleteVisitDetailsFetch({
        service_price_cents: 12000,
        payment: { paidOnlineAmountCents: 12000, remainingAmountCents: 0 },
      }),
    ).toBe(false);
    expect(
      bookingNeedsCompleteVisitDetailsFetch({
        service_price_cents: 12000,
      }),
    ).toBe(true);
  });

  it('isCompleteVisitPaidInFullOnline prefers remaining_amount_cents from booking_payments', () => {
    expect(
      isCompleteVisitPaidInFullOnline({
        paidOnlineCents: 5000,
        remainingAmountCents: 9500,
        subtotalCents: 14500,
      }),
    ).toBe(false);

    expect(
      isCompleteVisitPaidInFullOnline({
        paidOnlineCents: 14500,
        remainingAmountCents: 0,
        subtotalCents: 14500,
      }),
    ).toBe(true);
  });

  it('isCompleteVisitPaidInFullOnline falls back to subtotal math', () => {
    expect(
      isCompleteVisitPaidInFullOnline({
        paidOnlineCents: 14500,
        remainingAmountCents: null,
        subtotalCents: 14500,
      }),
    ).toBe(true);
  });
});

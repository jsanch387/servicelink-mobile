import { computeBookingEarningsCents, computeTodaysEarnings } from '../utils/todaysEarnings';

describe('today earnings', () => {
  it('uses the discounted booking total and explicit online payment', () => {
    expect(
      computeBookingEarningsCents({
        status: 'confirmed',
        subtotal_cents: 20000,
        discount_cents: 2000,
        booking_payments: {
          total_amount_cents: 20000,
          paid_online_amount_cents: 5000,
          session_fees_total_cents: 0,
          session_payment_amount_cents: 0,
        },
      }),
    ).toEqual({
      potentialCents: 18000,
      collectedCents: 5000,
      remainingCents: 13000,
    });
  });

  it('includes completion fees and session payments', () => {
    expect(
      computeBookingEarningsCents({
        status: 'completed',
        subtotal_cents: 20000,
        discount_cents: 0,
        booking_payments: {
          total_amount_cents: 20000,
          paid_online_amount_cents: 0,
          session_fees_total_cents: 2000,
          session_payment_amount_cents: 22000,
        },
      }),
    ).toEqual({
      potentialCents: 22000,
      collectedCents: 22000,
      remainingCents: 0,
    });
  });

  it('falls back to service and add-on snapshots', () => {
    expect(
      computeBookingEarningsCents({
        status: 'confirmed',
        service_price_cents: 10000,
        addon_details: [{ id: 'a1', name: 'Pet hair', priceCents: 5000 }],
      }),
    ).toEqual({
      potentialCents: 15000,
      collectedCents: 0,
      remainingCents: 15000,
    });
  });

  it('falls back to the payment total for legacy rows without pricing snapshots', () => {
    expect(
      computeBookingEarningsCents({
        status: 'confirmed',
        booking_payments: {
          total_amount_cents: 25000,
          paid_online_amount_cents: 10000,
          session_payment_amount_cents: 0,
        },
      }),
    ).toEqual({
      potentialCents: 25000,
      collectedCents: 10000,
      remainingCents: 15000,
    });
  });

  it('excludes canceled jobs and aggregates confirmed and completed jobs', () => {
    expect(
      computeTodaysEarnings([
        {
          status: 'confirmed',
          subtotal_cents: 20000,
          booking_payments: { paid_online_amount_cents: 5000 },
        },
        {
          status: 'completed',
          subtotal_cents: 15000,
          booking_payments: { session_payment_amount_cents: 15000 },
        },
        {
          status: 'cancelled',
          subtotal_cents: 50000,
          booking_payments: { paid_online_amount_cents: 50000 },
        },
      ]),
    ).toEqual({
      jobCount: 2,
      potentialCents: 35000,
      collectedCents: 20000,
      remainingCents: 15000,
    });
  });
});

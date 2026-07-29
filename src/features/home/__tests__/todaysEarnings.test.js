import { computeBookingEarningsCents, computeTodaysEarnings } from '../utils/todaysEarnings';

describe('today earnings', () => {
  it('uses the discounted booking total and remaining_amount_cents when present', () => {
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
          remaining_amount_cents: 13000,
        },
      }),
    ).toEqual({
      potentialCents: 18000,
      collectedCents: 5000,
      remainingCents: 13000,
    });
  });

  it('uses discounted total minus explicit payments when remaining is missing', () => {
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

  it('treats completed visits as fully collected even if session payment lags', () => {
    expect(
      computeBookingEarningsCents({
        status: 'completed',
        subtotal_cents: 57100,
        booking_payments: {
          total_amount_cents: 57100,
          paid_online_amount_cents: 0,
          session_fees_total_cents: 0,
          session_payment_amount_cents: 56100,
          remaining_amount_cents: 1000,
        },
      }),
    ).toEqual({
      potentialCents: 57100,
      collectedCents: 57100,
      remainingCents: 0,
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

  it('heals add-ons from addon_details when job_details selectedAddOns are empty', () => {
    expect(
      computeBookingEarningsCents({
        status: 'confirmed',
        service_price_cents: 21000,
        discount_cents: 2100,
        addon_details: {
          addons: [
            { id: 'a1', name: 'Pet hair', priceCents: 2000 },
            { id: 'a2', name: 'Engine Bay', priceCents: 6500 },
          ],
        },
        job_details: [{ serviceName: 'Detail', servicePriceCents: 21000, selectedAddOns: [] }],
      }),
    ).toEqual({
      potentialCents: 27400,
      collectedCents: 0,
      remainingCents: 27400,
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

  it('sums every job in job_details for multi-job visits (double / triple)', () => {
    expect(
      computeBookingEarningsCents({
        status: 'confirmed',
        // First-job-only denormalized column — must not win over job_details sum.
        service_price_cents: 22500,
        job_details: [
          {
            serviceName: 'Full detail',
            servicePriceCents: 22500,
            selectedAddOns: [{ id: 'a1', name: 'Pet hair', priceCents: 2500 }],
          },
          {
            serviceName: 'Touch-up',
            servicePriceCents: 7500,
            selectedAddOns: [],
          },
          {
            serviceName: 'Interior wipe',
            servicePriceCents: 5000,
            selectedAddOns: [{ id: 'a2', name: 'Shampoo', priceCents: 1500 }],
          },
        ],
        booking_payments: {
          paid_online_amount_cents: 0,
          session_payment_amount_cents: 0,
        },
      }),
    ).toEqual({
      // 225 + 75 + 50 + 25 + 15 = $390
      potentialCents: 39000,
      collectedCents: 0,
      remainingCents: 39000,
    });
  });

  it('uses appointment payment total for a multi-job visit when present', () => {
    expect(
      computeBookingEarningsCents({
        status: 'confirmed',
        service_price_cents: 22500,
        job_details: [
          { serviceName: 'A', servicePriceCents: 22500 },
          { serviceName: 'B', servicePriceCents: 7500 },
        ],
        booking_payments: {
          total_amount_cents: 30000,
          paid_online_amount_cents: 10000,
          remaining_amount_cents: 20000,
          session_payment_amount_cents: 0,
        },
      }),
    ).toEqual({
      potentialCents: 30000,
      collectedCents: 10000,
      remainingCents: 20000,
    });
  });

  it('counts one multi-job appointment as one earnings row, not per job', () => {
    expect(
      computeTodaysEarnings([
        {
          status: 'confirmed',
          job_details: [
            { serviceName: 'A', servicePriceCents: 10000 },
            { serviceName: 'B', servicePriceCents: 10000 },
          ],
        },
      ]),
    ).toEqual({
      jobCount: 1,
      potentialCents: 20000,
      collectedCents: 0,
      remainingCents: 20000,
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

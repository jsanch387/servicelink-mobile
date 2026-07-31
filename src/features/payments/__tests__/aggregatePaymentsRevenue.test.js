import { REVENUE_RANGE } from '../constants/paymentsRevenueRanges';
import { aggregatePaymentsRevenue } from '../utils/aggregatePaymentsRevenue';

function completedRow({ id, scheduled_date, totalCents, status = 'completed' }) {
  return {
    id,
    status,
    scheduled_date,
    service_price_cents: totalCents,
    subtotal_cents: totalCents,
    discount_cents: 0,
    booking_payments: {
      total_amount_cents: totalCents,
      paid_online_amount_cents: totalCents,
      session_fees_total_cents: 0,
      session_payment_amount_cents: 0,
      remaining_amount_cents: 0,
    },
  };
}

describe('aggregatePaymentsRevenue', () => {
  const now = new Date(2026, 6, 15); // Wed Jul 15, 2026

  it('sums completed jobs for the current month and builds week bars', () => {
    const currentRows = [
      completedRow({ id: '1', scheduled_date: '2026-07-02', totalCents: 10000 }),
      completedRow({ id: '2', scheduled_date: '2026-07-10', totalCents: 20000 }),
    ];

    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.MONTH,
      currentRows,
      previousRows: [completedRow({ id: 'p', scheduled_date: '2026-06-05', totalCents: 15000 })],
      now,
    });

    expect(summary.collectedCents).toBe(30000);
    expect(summary.jobsPaid).toBe(2);
    expect(summary.bars.length).toBeGreaterThanOrEqual(4);
    expect(summary.changePct).toBe(Math.round(((30000 - 15000) / 15000) * 100));
    expect(summary.compareLabel).toBe('vs last month');
  });

  it('builds weekday bars for the week window', () => {
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.WEEK,
      currentRows: [
        completedRow({ id: '1', scheduled_date: '2026-07-13', totalCents: 5000 }), // Mon
        completedRow({ id: '2', scheduled_date: '2026-07-15', totalCents: 7000 }), // Wed
      ],
      previousRows: [],
      now,
    });

    expect(summary.bars).toHaveLength(7);
    expect(summary.bars[0].label).toBe('Mo');
    expect(summary.bars[0].cents).toBe(5000);
    expect(summary.bars[2].cents).toBe(7000);
    expect(summary.collectedCents).toBe(12000);
  });

  it('returns zeros and flat bars when there are no completed jobs', () => {
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.MONTH,
      currentRows: [],
      previousRows: [],
      now,
    });

    expect(summary.collectedCents).toBe(0);
    expect(summary.jobsPaid).toBe(0);
    expect(summary.changePct).toBeNull();
    expect(summary.compareLabel).toBeNull();
    expect(summary.bars.length).toBeGreaterThan(0);
    expect(summary.bars.every((b) => b.cents === 0)).toBe(true);
  });

  it('ignores non-completed statuses', () => {
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.ALL,
      currentRows: [
        completedRow({
          id: '1',
          scheduled_date: '2026-01-01',
          totalCents: 10000,
          status: 'confirmed',
        }),
        completedRow({ id: '2', scheduled_date: '2025-03-01', totalCents: 4000 }),
      ],
      now,
    });

    expect(summary.collectedCents).toBe(4000);
    expect(summary.jobsPaid).toBe(1);
    expect(summary.bars.some((b) => b.label === '2025' && b.cents === 4000)).toBe(true);
  });

  it('builds twelve month bars for year range', () => {
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.YEAR,
      currentRows: [
        completedRow({ id: '1', scheduled_date: '2026-01-10', totalCents: 1000 }),
        completedRow({ id: '2', scheduled_date: '2026-07-10', totalCents: 2500 }),
      ],
      previousRows: [completedRow({ id: 'p', scheduled_date: '2025-06-01', totalCents: 1000 })],
      now,
    });

    expect(summary.bars).toHaveLength(12);
    expect(summary.bars[0].label).toBe('Jan');
    expect(summary.bars[0].cents).toBe(1000);
    expect(summary.bars[6].label).toBe('Jul');
    expect(summary.bars[6].cents).toBe(2500);
    expect(summary.collectedCents).toBe(3500);
    expect(summary.changePct).toBe(250);
    expect(summary.compareLabel).toBe('vs last year');
  });

  it('treats first dollars after a zero previous period as +100%', () => {
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.WEEK,
      currentRows: [completedRow({ id: '1', scheduled_date: '2026-07-15', totalCents: 8000 })],
      previousRows: [],
      now,
    });

    expect(summary.changePct).toBe(100);
    expect(summary.compareLabel).toBe('vs last week');
  });

  it('omits change when both periods are empty', () => {
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.WEEK,
      currentRows: [],
      previousRows: [],
      now,
    });

    expect(summary.changePct).toBeNull();
    expect(summary.compareLabel).toBeNull();
  });

  it('omits period compare for all-time', () => {
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.ALL,
      currentRows: [completedRow({ id: '1', scheduled_date: '2024-05-01', totalCents: 9000 })],
      previousRows: [completedRow({ id: 'p', scheduled_date: '2023-01-01', totalCents: 1000 })],
      now,
    });

    expect(summary.collectedCents).toBe(9000);
    expect(summary.changePct).toBeNull();
    expect(summary.compareLabel).toBeNull();
  });

  it('skips rows without a usable scheduled day', () => {
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.ALL,
      currentRows: [
        completedRow({ id: '1', scheduled_date: null, totalCents: 5000 }),
        completedRow({ id: '2', scheduled_date: '2026-02-01', totalCents: 3000 }),
      ],
      now,
    });

    expect(summary.jobsPaid).toBe(1);
    expect(summary.collectedCents).toBe(3000);
  });

  it('aggregates multiple jobs on the same calendar day', () => {
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.WEEK,
      currentRows: [
        completedRow({ id: '1', scheduled_date: '2026-07-15', totalCents: 4000 }),
        completedRow({ id: '2', scheduled_date: '2026-07-15', totalCents: 6000 }),
      ],
      now,
    });

    expect(summary.jobsPaid).toBe(2);
    expect(summary.collectedCents).toBe(10000);
    expect(summary.bars[2].cents).toBe(10000); // Wed
  });
});

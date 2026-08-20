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

  it('sums completed jobs for the current month into four week buckets', () => {
    const currentRows = [
      completedRow({ id: '1', scheduled_date: '2026-07-02', totalCents: 10000 }), // Wk 1
      completedRow({ id: '2', scheduled_date: '2026-07-10', totalCents: 20000 }), // Wk 2
      completedRow({ id: '3', scheduled_date: '2026-07-30', totalCents: 5000 }), // Wk 4
    ];

    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.MONTH,
      currentRows,
      previousRows: [completedRow({ id: 'p', scheduled_date: '2026-06-05', totalCents: 15000 })],
      now,
    });

    expect(summary.collectedCents).toBe(35000);
    expect(summary.jobsPaid).toBe(3);
    expect(summary.bars).toHaveLength(4);
    expect(summary.bars.map((b) => b.label)).toEqual(['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4']);
    expect(summary.bars[0].cents).toBe(10000);
    expect(summary.bars[1].cents).toBe(20000);
    expect(summary.bars[2].cents).toBe(0);
    expect(summary.bars[3].cents).toBe(5000);
    expect(summary.changePct).toBe(Math.round(((35000 - 15000) / 15000) * 100));
    expect(summary.compareLabel).toBe('vs last month');
  });

  it('keeps exactly four weeks even when calendar weeks would spill to six', () => {
    const augustNow = new Date(2026, 7, 15);
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.MONTH,
      currentRows: [],
      now: augustNow,
    });

    expect(summary.bars).toHaveLength(4);
    expect(summary.bars.map((b) => b.label)).toEqual(['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4']);
  });

  it('folds the end of short months into week 4', () => {
    const febNow = new Date(2026, 1, 10);
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.MONTH,
      currentRows: [
        completedRow({ id: '1', scheduled_date: '2026-02-20', totalCents: 4000 }),
        completedRow({ id: '2', scheduled_date: '2026-02-28', totalCents: 1000 }),
      ],
      now: febNow,
    });

    expect(summary.bars).toHaveLength(4);
    expect(summary.bars[2].cents).toBe(4000);
    expect(summary.bars[3].cents).toBe(1000);
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
    expect(summary.bars[0].fullLabel).toBe('Mon, Jul 13');
    expect(summary.bars[0].cents).toBe(5000);
    expect(summary.bars[2].cents).toBe(7000);
    expect(summary.bars[2].fullLabel).toBe('Wed, Jul 15');
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

  it('builds daily bars and prior-period compare for a short custom range', () => {
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.CUSTOM,
      fromYmd: '2026-07-13',
      toYmd: '2026-07-15',
      currentRows: [
        completedRow({ id: '1', scheduled_date: '2026-07-13', totalCents: 4000 }),
        completedRow({ id: '2', scheduled_date: '2026-07-15', totalCents: 6000 }),
      ],
      previousRows: [completedRow({ id: 'p', scheduled_date: '2026-07-10', totalCents: 5000 })],
      now,
    });

    expect(summary.collectedCents).toBe(10000);
    expect(summary.jobsPaid).toBe(2);
    expect(summary.bucketKind).toBe('daily');
    expect(summary.bars).toHaveLength(3);
    expect(summary.bars[0].label).toBe('13');
    expect(summary.bars[0].cents).toBe(4000);
    expect(summary.bars[2].cents).toBe(6000);
    expect(summary.changePct).toBe(100);
    expect(summary.compareLabel).toBe('vs prior period');
  });

  it('uses weekly chunks for custom ranges longer than 31 days', () => {
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.CUSTOM,
      fromYmd: '2026-06-01',
      toYmd: '2026-07-12',
      currentRows: [
        completedRow({ id: '1', scheduled_date: '2026-06-03', totalCents: 2000 }),
        completedRow({ id: '2', scheduled_date: '2026-06-10', totalCents: 3000 }),
      ],
      now,
    });

    expect(summary.bucketKind).toBe('weekly');
    expect(summary.bars.length).toBeGreaterThan(4);
    expect(summary.bars[0].label).toBe('Jun 1');
    expect(summary.bars[0].cents).toBe(2000);
    expect(summary.bars[1].cents).toBe(3000);
    expect(summary.collectedCents).toBe(5000);
  });

  it('uses monthly bars for long custom ranges', () => {
    const summary = aggregatePaymentsRevenue({
      range: REVENUE_RANGE.CUSTOM,
      fromYmd: '2025-01-15',
      toYmd: '2026-07-15',
      currentRows: [
        completedRow({ id: '1', scheduled_date: '2025-02-01', totalCents: 1000 }),
        completedRow({ id: '2', scheduled_date: '2026-07-10', totalCents: 4000 }),
      ],
      now,
    });

    expect(summary.bucketKind).toBe('monthly');
    expect(summary.bars[0].label).toBe('Jan 25');
    expect(summary.bars.some((b) => b.cents === 1000)).toBe(true);
    expect(summary.bars.some((b) => b.cents === 4000)).toBe(true);
    expect(summary.collectedCents).toBe(5000);
  });
});

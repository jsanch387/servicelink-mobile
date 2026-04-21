import { buildCustomerCards } from '../api/customers';

describe('buildCustomerCards', () => {
  const nowMs = new Date('2026-04-20T12:00:00').getTime();

  it('builds new lifecycle with upcoming appointment details', () => {
    const customers = [{ id: 'c1', full_name: 'Jane Fuller' }];
    const bookings = [
      {
        customer_id: 'c1',
        service_price_cents: 15000,
        addon_details: [{ priceCents: 2500 }],
        scheduled_date: '2026-04-25',
        start_time: '10:00:00',
        status: 'confirmed',
      },
      {
        customer_id: 'c1',
        service_price_cents: 12000,
        addon_details: null,
        scheduled_date: '2026-03-01',
        start_time: '09:00:00',
        status: 'completed',
      },
    ];

    const out = buildCustomerCards(customers, bookings, nowMs);
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe('new');
    expect(out[0].totalVisits).toBe(1);
    expect(out[0].totalSpent).toBe(12000);
    expect(out[0].scheduleLabel).toBe('Next appointment');
    expect(out[0].nextAppointmentDaysUntil).toBe(5);
    expect(out[0].nextAppointmentDateLabel).toBeTruthy();
    expect(out[0].nextAppointmentRelativeLabel).toBe('in 5 days');
  });

  it('marks customer as returning when completed visits are greater than one', () => {
    const customers = [{ id: 'c2', full_name: 'Returning Customer' }];
    const bookings = [
      {
        customer_id: 'c2',
        service_price_cents: 1000,
        addon_details: { addons: [{ priceCents: 300 }] },
        scheduled_date: '2026-01-01',
        start_time: '10:00:00',
        status: 'completed',
      },
      {
        customer_id: 'c2',
        service_price_cents: 2000,
        addon_details: { items: [{ price_cents: 700 }] },
        scheduled_date: '2026-02-01',
        start_time: '10:00:00',
        status: 'completed',
      },
    ];

    const out = buildCustomerCards(customers, bookings, nowMs);
    expect(out[0].status).toBe('returning');
    expect(out[0].totalVisits).toBe(2);
    expect(out[0].totalSpent).toBe(4000);
  });

  it('overrides lifecycle to due when no upcoming and last visit is over 90 days', () => {
    const customers = [{ id: 'c3', full_name: 'Due Customer' }];
    const bookings = [
      {
        customer_id: 'c3',
        service_price_cents: 9000,
        addon_details: null,
        scheduled_date: '2025-12-01',
        start_time: '10:00:00',
        status: 'completed',
      },
    ];

    const out = buildCustomerCards(customers, bookings, nowMs);
    expect(out[0].status).toBe('due');
    expect(out[0].lastVisitDaysAgo).toBeGreaterThan(90);
    expect(out[0].scheduleLabel).toBe('Last visit');
  });
});

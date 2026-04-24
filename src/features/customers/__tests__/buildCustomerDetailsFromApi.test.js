import { buildCustomerDetailsFromApi } from '../customer-details/utils/buildCustomerDetailsFromApi';

describe('buildCustomerDetailsFromApi', () => {
  const nowMs = new Date('2026-04-20T12:00:00').getTime();

  const baseRow = {
    id: 'c1',
    full_name: 'Jane Fuller',
    phone: '(555) 000-0000',
    email: 'jane@example.com',
    notes: 'Gate code 1234',
  };

  it('maps CRM row + completed booking to stats and notes', () => {
    const bookings = [
      {
        customer_id: 'c1',
        service_price_cents: 12000,
        addon_details: [{ priceCents: 500 }],
        scheduled_date: '2026-03-01',
        start_time: '09:00:00',
        status: 'completed',
      },
    ];

    const m = buildCustomerDetailsFromApi(baseRow, bookings, nowMs);
    expect(m.fullName).toBe('Jane Fuller');
    expect(m.totalVisitsLabel).toBe('1');
    expect(m.totalSpendLabel).toMatch(/125/);
    expect(m.ownerNotes).toBe('Gate code 1234');
    expect(m.segment).toBe('new');
    expect(m.lastVisitLabel).not.toBe('—');
    expect(m.lastVisitRelativeLabel.length).toBeGreaterThan(0);
  });

  it('marks returning when more than one completed visit', () => {
    const bookings = [
      {
        customer_id: 'c1',
        service_price_cents: 1000,
        addon_details: null,
        scheduled_date: '2026-01-01',
        start_time: '10:00:00',
        status: 'completed',
      },
      {
        customer_id: 'c1',
        service_price_cents: 2000,
        addon_details: null,
        scheduled_date: '2026-02-01',
        start_time: '10:00:00',
        status: 'completed',
      },
    ];

    const m = buildCustomerDetailsFromApi(baseRow, bookings, nowMs);
    expect(m.segment).toBe('returning');
    expect(m.totalVisitsLabel).toBe('2');
  });
});

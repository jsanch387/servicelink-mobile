import { buildMaintenanceInvitePayload } from '../maintenance-invite/utils/buildMaintenanceInvitePayload';

describe('buildMaintenanceInvitePayload', () => {
  const base = {
    businessId: 'biz-1',
    businessSlug: 'acme-detail',
    customerId: 'cust-1',
    priceUsdText: '100',
    durationHhMm: '01:00',
  };

  it('builds required mobile fields in cents and minutes', () => {
    const result = buildMaintenanceInvitePayload(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body).toEqual({
      businessId: 'biz-1',
      businessSlug: 'acme-detail',
      customerId: 'cust-1',
      serviceNameSnapshot: 'Maintenance',
      priceCents: 10000,
      durationMinutes: 60,
    });
  });

  it('includes anchor date and time when date is set', () => {
    const result = buildMaintenanceInvitePayload({
      ...base,
      preferredDateYyyyMmDd: '2026-06-15',
      preferredTime12h: '10:00 AM',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.anchorDate).toBe('2026-06-15');
    expect(result.body.anchorTime).toBe('10:00');
  });

  it('omits anchor fields when date is not set', () => {
    const result = buildMaintenanceInvitePayload({
      ...base,
      preferredTime12h: '10:00 AM',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.anchorDate).toBeUndefined();
    expect(result.body.anchorTime).toBeUndefined();
  });

  it('requires business slug', () => {
    const result = buildMaintenanceInvitePayload({ ...base, businessSlug: '' });
    expect(result.ok).toBe(false);
  });
});

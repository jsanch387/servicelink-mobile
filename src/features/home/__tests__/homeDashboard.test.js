jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import {
  bookingTitleLine,
  partitionUpcomingConfirmed,
  pickHomeSpotlight,
} from '../api/homeDashboard';

function booking(partial) {
  return {
    id: partial.id ?? 'bk-1',
    scheduled_date: partial.scheduled_date,
    start_time: partial.start_time,
    status: partial.status ?? 'confirmed',
    service_name: partial.service_name ?? null,
    customer_name: partial.customer_name ?? null,
    customer_phone: null,
    customer_street_address: null,
    customer_unit_apt: null,
    customer_city: null,
    customer_state: null,
    customer_zip: null,
    duration_minutes: partial.duration_minutes ?? null,
  };
}

describe('partitionUpcomingConfirmed', () => {
  const farFutureNow = new Date('2099-06-01T12:00:00').getTime();

  it('returns empty when there are no rows', () => {
    const { upcoming, next } = partitionUpcomingConfirmed([], 0);
    expect(upcoming).toEqual([]);
    expect(next).toBeNull();
  });

  it('skips non-confirmed rows', () => {
    const rows = [
      booking({
        id: 'a',
        scheduled_date: '2030-01-15',
        start_time: '10:00:00',
        status: 'cancelled',
      }),
    ];
    const { upcoming, next } = partitionUpcomingConfirmed(rows, 0);
    expect(upcoming).toEqual([]);
    expect(next).toBeNull();
  });

  it('skips appointments that already started (before nowMs)', () => {
    const rows = [
      booking({
        id: 'past',
        scheduled_date: '2020-01-15',
        start_time: '10:00:00',
      }),
    ];
    const { upcoming, next } = partitionUpcomingConfirmed(rows, farFutureNow);
    expect(upcoming).toEqual([]);
    expect(next).toBeNull();
  });

  it('keeps future confirmed rows and picks the earliest as next', () => {
    const rows = [
      booking({
        id: 'later',
        scheduled_date: '2030-06-02',
        start_time: '14:00:00',
      }),
      booking({
        id: 'earlier',
        scheduled_date: '2030-06-02',
        start_time: '09:00:00',
      }),
      booking({
        id: 'day-before',
        scheduled_date: '2030-06-01',
        start_time: '16:00:00',
      }),
    ];
    const { upcoming, next } = partitionUpcomingConfirmed(rows, 0);
    expect(upcoming).toHaveLength(3);
    expect(next?.id).toBe('day-before');
    const ordered = upcoming.map((r) => r.id);
    expect(ordered).toEqual(['day-before', 'earlier', 'later']);
  });
});

describe('pickHomeSpotlight', () => {
  it('prefers an in-window confirmed visit over a later upcoming one', () => {
    const nowMs = new Date('2026-06-15T15:00:00').getTime();
    const rows = [
      booking({
        id: 'live',
        scheduled_date: '2026-06-15',
        start_time: '14:00:00',
        duration_minutes: 120,
      }),
      booking({
        id: 'later',
        scheduled_date: '2026-06-15',
        start_time: '18:00:00',
        duration_minutes: 60,
      }),
    ];
    const out = pickHomeSpotlight(rows, nowMs);
    expect(out.spotlightMode).toBe('in_progress');
    expect(out.spotlight?.id).toBe('live');
    expect(out.upcomingCount).toBe(1);
  });

  it('falls back to next upcoming when nothing is in the in-progress window', () => {
    const nowMs = new Date('2026-06-15T16:30:00').getTime();
    const rows = [
      booking({
        id: 'ended',
        scheduled_date: '2026-06-15',
        start_time: '14:00:00',
        duration_minutes: 60,
      }),
      booking({
        id: 'later',
        scheduled_date: '2026-06-15',
        start_time: '18:00:00',
        duration_minutes: 60,
      }),
    ];
    const out = pickHomeSpotlight(rows, nowMs);
    expect(out.spotlightMode).toBe('upcoming');
    expect(out.spotlight?.id).toBe('later');
  });

  it('uses default duration when duration_minutes is missing so a recent start can still be live', () => {
    const nowMs = new Date('2026-06-15T15:00:00').getTime();
    const rows = [
      booking({
        id: 'live',
        scheduled_date: '2026-06-15',
        start_time: '14:00:00',
      }),
    ];
    const out = pickHomeSpotlight(rows, nowMs);
    expect(out.spotlightMode).toBe('in_progress');
    expect(out.spotlight?.id).toBe('live');
  });
});

describe('bookingTitleLine', () => {
  it('uses trimmed customer and service names', () => {
    expect(
      bookingTitleLine({
        customer_name: '  Jane  ',
        service_name: '  Deep clean  ',
      }),
    ).toBe('Jane — Deep clean');
  });

  it('falls back to Customer and Service when names missing', () => {
    expect(bookingTitleLine({ customer_name: null, service_name: null })).toBe(
      'Customer — Service',
    );
  });
});

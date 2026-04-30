import { parseAvailabilityForSchedule } from '../utils/createFlowAvailability';

describe('parseAvailabilityForSchedule', () => {
  it('defaults when row missing', () => {
    const out = parseAvailabilityForSchedule(null);
    expect(out.acceptBookings).toBe(false);
    expect(out.weeklySchedule).toEqual({});
    expect(out.timeOffBlocks).toEqual([]);
  });

  it('parses flags and JSON fields', () => {
    const out = parseAvailabilityForSchedule({
      accept_bookings: true,
      weekly_schedule: { monday: { enabled: true } },
      time_off_blocks: [{ date: '2026-01-01' }],
    });
    expect(out.acceptBookings).toBe(true);
    expect(out.weeklySchedule).toEqual({ monday: { enabled: true } });
    expect(out.timeOffBlocks).toEqual([{ date: '2026-01-01' }]);
  });
});

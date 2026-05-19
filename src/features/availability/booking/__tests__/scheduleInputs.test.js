import { parseScheduleInputs } from '../utils/scheduleInputs';

describe('parseScheduleInputs', () => {
  it('defaults when row missing', () => {
    const out = parseScheduleInputs(null);
    expect(out.acceptBookings).toBe(false);
    expect(out.weeklySchedule).toEqual({});
    expect(out.timeOffBlocks).toEqual([]);
  });

  it('parses flags and normalizes time off blocks', () => {
    const out = parseScheduleInputs({
      accept_bookings: true,
      weekly_schedule: { monday: { enabled: true, start: '09:00', end: '17:00' } },
      time_off_blocks: [
        {
          id: 'b1',
          date: '2026-01-01',
          start_time: '09:15',
          end_time: '10:45',
        },
      ],
    });
    expect(out.acceptBookings).toBe(true);
    expect(out.weeklySchedule.monday.enabled).toBe(true);
    expect(out.timeOffBlocks).toHaveLength(1);
    expect(out.timeOffBlocks[0].start_time).toBe('09:00');
    expect(out.timeOffBlocks[0].end_time).toBe('10:30');
  });
});

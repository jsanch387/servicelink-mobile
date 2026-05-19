import {
  formatSelectedDateLabel,
  getTimeSlotsForDateKey,
  isSelectedScheduleStillValid,
} from '../utils/bookingCalendar';

describe('bookingCalendar', () => {
  const ctx = {
    acceptBookings: true,
    weeklySchedule: {
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
    },
    totalDurationMinutes: 60,
    blockingBookingRows: [],
    timeOffBlocks: [],
  };

  it('formatSelectedDateLabel formats a readable line', () => {
    const label = formatSelectedDateLabel('2026-04-29');
    expect(label).toContain('2026');
    expect(label.length).toBeGreaterThan(10);
  });

  it('getTimeSlotsForDateKey returns empty when bookings off', () => {
    expect(getTimeSlotsForDateKey('2026-04-29', { ...ctx, acceptBookings: false })).toEqual([]);
  });

  it('isSelectedScheduleStillValid rejects unavailable dates', () => {
    const sundayCtx = {
      ...ctx,
      weeklySchedule: {
        sunday: { enabled: false, start: '09:00', end: '17:00' },
      },
    };
    const { dateValid } = isSelectedScheduleStillValid(sundayCtx, '2026-05-17', null, {
      scheduleLoading: false,
    });
    expect(dateValid).toBe(false);
  });
});

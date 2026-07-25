import {
  bookingDateKey,
  generateTimeSlots,
  timeStringToMinutesFromMidnight,
} from '../utils/slotGeneration';

describe('slotGeneration', () => {
  const weekly = {
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
  };

  it('timeStringToMinutesFromMidnight parses common shapes', () => {
    expect(timeStringToMinutesFromMidnight('09:30')).toBe(570);
    expect(timeStringToMinutesFromMidnight('09:30:00')).toBe(570);
  });

  it('bookingDateKey reads scheduled_date, scheduledDate, and date', () => {
    expect(bookingDateKey({ scheduled_date: '2026-05-14' })).toBe('2026-05-14');
    expect(bookingDateKey({ date: '2026-05-15' })).toBe('2026-05-15');
    expect(bookingDateKey({ scheduled_date: '2026-05-14T00:00:00.000Z' })).toBe('2026-05-14');
  });

  it('generateTimeSlots returns 30-min increments within window', () => {
    const slots = generateTimeSlots({
      dateKey: '2026-04-29',
      weeklySchedule: weekly,
      serviceDurationMinutes: 60,
      existingBookings: [],
      timeOffBlocks: [],
      nowMs: Date.parse('2026-04-01T12:00:00'),
    });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]).toMatch(/AM|PM/);
  });

  it('generateTimeSlots respects blocking booking overlap', () => {
    const slots = generateTimeSlots({
      dateKey: '2026-04-29',
      weeklySchedule: weekly,
      serviceDurationMinutes: 60,
      existingBookings: [
        { scheduled_date: '2026-04-29', start_time: '10:00:00', duration_minutes: 60 },
      ],
      timeOffBlocks: [],
      nowMs: Date.parse('2026-04-01T12:00:00'),
    });
    expect(slots.includes('10:00 AM')).toBe(false);
  });

  it('generateTimeSlots respects time off overlap', () => {
    const slots = generateTimeSlots({
      dateKey: '2026-04-29',
      weeklySchedule: weekly,
      serviceDurationMinutes: 60,
      existingBookings: [],
      timeOffBlocks: [
        {
          id: '1',
          date: '2026-04-29',
          start_time: '10:00',
          end_time: '12:00',
        },
      ],
      nowMs: Date.parse('2026-04-01T12:00:00'),
    });
    expect(slots.includes('10:00 AM')).toBe(false);
    expect(slots.includes('11:30 AM')).toBe(false);
    expect(slots.includes('9:00 AM')).toBe(true);
  });

  it('generateTimeSlots blocks all days in an all-day range', () => {
    const blocks = [
      {
        id: 'vac',
        start_date: '2026-04-28',
        end_date: '2026-04-30',
        all_day: true,
        start_time: '00:00',
        end_time: '23:59',
      },
    ];
    const mid = generateTimeSlots({
      dateKey: '2026-04-29',
      weeklySchedule: weekly,
      serviceDurationMinutes: 60,
      existingBookings: [],
      timeOffBlocks: blocks,
      nowMs: Date.parse('2026-04-01T12:00:00'),
    });
    expect(mid).toEqual([]);

    const outside = generateTimeSlots({
      dateKey: '2026-05-06',
      weeklySchedule: weekly,
      serviceDurationMinutes: 60,
      existingBookings: [],
      timeOffBlocks: blocks,
      nowMs: Date.parse('2026-04-01T12:00:00'),
    });
    expect(outside.includes('9:00 AM')).toBe(true);
  });

  it('generateTimeSlots respects minimum notice lead time', () => {
    const slots = generateTimeSlots({
      dateKey: '2026-04-29',
      weeklySchedule: weekly,
      serviceDurationMinutes: 60,
      existingBookings: [],
      timeOffBlocks: [],
      minimumNotice: '30m',
      nowMs: Date.parse('2026-04-29T09:00:00'),
    });
    expect(slots.includes('9:00 AM')).toBe(false);
    expect(slots.includes('9:30 AM')).toBe(true);
  });

  it('ownerManualBooking skips lead time and time off', () => {
    const blocks = [
      {
        id: 'vac',
        start_date: '2026-04-29',
        end_date: '2026-04-29',
        all_day: true,
        start_time: '00:00',
        end_time: '23:59',
      },
    ];
    const slots = generateTimeSlots({
      dateKey: '2026-04-29',
      weeklySchedule: weekly,
      serviceDurationMinutes: 60,
      existingBookings: [],
      timeOffBlocks: blocks,
      minimumNotice: '2h',
      ownerManualBooking: true,
      nowMs: Date.parse('2026-04-29T09:00:00'),
    });
    expect(slots.includes('9:00 AM')).toBe(true);
    expect(slots.includes('9:30 AM')).toBe(true);
  });
});

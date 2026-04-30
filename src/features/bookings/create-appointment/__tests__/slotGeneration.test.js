import { generateTimeSlots, timeStringToMinutesFromMidnight } from '../utils/slotGeneration';

describe('slotGeneration', () => {
  const weekly = {
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
  };

  it('timeStringToMinutesFromMidnight parses common shapes', () => {
    expect(timeStringToMinutesFromMidnight('09:30')).toBe(570);
    expect(timeStringToMinutesFromMidnight('09:30:00')).toBe(570);
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
});

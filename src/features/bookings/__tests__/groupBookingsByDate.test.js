import {
  formatBookingSectionTitle,
  groupBookingsByScheduledDate,
} from '../utils/groupBookingsByDate';

function row(id, scheduled_date, start_time = '10:00:00') {
  return { id, scheduled_date, start_time, status: 'confirmed' };
}

describe('groupBookingsByScheduledDate', () => {
  it('returns empty for empty input', () => {
    expect(groupBookingsByScheduledDate([])).toEqual([]);
    expect(groupBookingsByScheduledDate(null)).toEqual([]);
  });

  it('groups same calendar day and preserves order within the day', () => {
    const bookings = [
      row('1', '2026-03-31', '09:00:00'),
      row('2', '2026-03-31', '14:00:00'),
      row('3', '2026-04-01', '11:00:00'),
    ];
    const sections = groupBookingsByScheduledDate(bookings);
    expect(sections).toHaveLength(2);
    expect(sections[0].dateKey).toBe('2026-03-31');
    expect(sections[0].data.map((b) => b.id)).toEqual(['1', '2']);
    expect(sections[1].dateKey).toBe('2026-04-01');
    expect(sections[1].data.map((b) => b.id)).toEqual(['3']);
  });
});

describe('formatBookingSectionTitle', () => {
  it('returns raw string for invalid input', () => {
    expect(formatBookingSectionTitle('')).toBe('');
  });
});

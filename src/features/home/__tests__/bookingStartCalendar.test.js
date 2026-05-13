import {
  calendarYyyyMmDdFromScheduledDate,
  filterBookingsToCalendarDay,
} from '../utils/bookingStart';

describe('calendarYyyyMmDdFromScheduledDate', () => {
  it('extracts YYYY-MM-DD from date and ISO strings', () => {
    expect(calendarYyyyMmDdFromScheduledDate('2026-05-14')).toBe('2026-05-14');
    expect(calendarYyyyMmDdFromScheduledDate('2026-05-14T00:00:00.000Z')).toBe('2026-05-14');
  });

  it('returns empty for invalid input', () => {
    expect(calendarYyyyMmDdFromScheduledDate(null)).toBe('');
    expect(calendarYyyyMmDdFromScheduledDate('')).toBe('');
    expect(calendarYyyyMmDdFromScheduledDate('nope')).toBe('');
  });
});

describe('filterBookingsToCalendarDay', () => {
  it('drops rows that are not on the target calendar day', () => {
    const rows = [
      { id: 'a', scheduled_date: '2026-05-13', start_time: '10:00:00' },
      { id: 'b', scheduled_date: '2026-05-14', start_time: '09:00:00' },
      { id: 'c', scheduled_date: '2026-05-14T00:00:00.000Z', start_time: '09:00:00' },
    ];
    expect(filterBookingsToCalendarDay(rows, '2026-05-13')).toEqual([rows[0]]);
  });

  it('returns empty when yyyyMmDd is invalid', () => {
    expect(filterBookingsToCalendarDay([{ scheduled_date: '2026-05-13' }], 'bad')).toEqual([]);
  });
});

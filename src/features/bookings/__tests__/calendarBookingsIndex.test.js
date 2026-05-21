import {
  bookingCountsByDateKey,
  bookingCountsFromScheduledRows,
  bookingsForDateKey,
  indexBookingsByScheduledDate,
} from '../utils/calendarBookingsIndex';

function row(id, scheduled_date) {
  return { id, scheduled_date, start_time: '10:00:00', status: 'confirmed' };
}

describe('calendarBookingsIndex', () => {
  it('groups rows by scheduled_date', () => {
    const byDate = indexBookingsByScheduledDate([
      row('a', '2026-05-20'),
      row('b', '2026-05-20'),
      row('c', '2026-05-21'),
    ]);
    expect(byDate['2026-05-20']).toHaveLength(2);
    expect(byDate['2026-05-21']).toHaveLength(1);
    expect(bookingCountsByDateKey(byDate)).toEqual({
      '2026-05-20': 2,
      '2026-05-21': 1,
    });
    expect(bookingsForDateKey(byDate, '2026-05-20').map((r) => r.id)).toEqual(['a', 'b']);
    expect(bookingsForDateKey(byDate, '2026-05-99')).toEqual([]);
  });

  it('skips rows without a scheduled_date string', () => {
    expect(
      bookingCountsFromScheduledRows([
        { scheduled_date: null, status: 'confirmed' },
        { scheduled_date: '2026-05-20', status: 'confirmed' },
      ]),
    ).toEqual({ '2026-05-20': 1 });
  });

  it('builds counts from lightweight scheduled_date rows', () => {
    expect(
      bookingCountsFromScheduledRows([
        { scheduled_date: '2026-05-20', status: 'confirmed' },
        { scheduled_date: '2026-05-20', status: 'confirmed' },
        { scheduled_date: '2026-05-21', status: 'confirmed' },
      ]),
    ).toEqual({
      '2026-05-20': 2,
      '2026-05-21': 1,
    });
  });
});

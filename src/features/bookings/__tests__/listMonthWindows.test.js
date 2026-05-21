import { BOOKINGS_FILTER_PAST, BOOKINGS_FILTER_UPCOMING } from '../constants';
import {
  getInitialListMonthWindow,
  getLoadMoreLabel,
  getNextListMonthWindow,
} from '../utils/listMonthWindows';

describe('listMonthWindows', () => {
  const now = new Date(2026, 4, 21);

  it('upcoming initial window is today through end of current month', () => {
    expect(getInitialListMonthWindow(BOOKINGS_FILTER_UPCOMING, now)).toEqual({
      start: '2026-05-21',
      end: '2026-05-31',
    });
  });

  it('past initial window is current calendar month through today', () => {
    expect(getInitialListMonthWindow(BOOKINGS_FILTER_PAST, now)).toEqual({
      start: '2026-05-01',
      end: '2026-05-21',
    });
  });

  it('past load more goes to the previous month', () => {
    const initial = getInitialListMonthWindow(BOOKINGS_FILTER_PAST, now);
    const next = getNextListMonthWindow(BOOKINGS_FILTER_PAST, initial);
    expect(next).toEqual({ start: '2026-04-01', end: '2026-04-30' });
    expect(getLoadMoreLabel(BOOKINGS_FILTER_PAST, next)).toBe('Load April 2026');
  });

  it('returns null for invalid window start when loading more past months', () => {
    expect(
      getNextListMonthWindow(BOOKINGS_FILTER_PAST, { start: 'bad', end: '2026-05-21' }),
    ).toBeNull();
  });

  it('stops past pagination before year 2020', () => {
    const jan2020 = { start: '2020-01-01', end: '2020-01-31' };
    expect(getNextListMonthWindow(BOOKINGS_FILTER_PAST, jan2020)).toBeNull();
  });

  it('returns empty load-more label when there is no next window', () => {
    expect(getLoadMoreLabel(BOOKINGS_FILTER_PAST, null)).toBe('');
  });
});

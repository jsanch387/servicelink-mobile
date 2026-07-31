import { REVENUE_RANGE } from '../constants/paymentsRevenueRanges';
import {
  revenueDateWindow,
  parseLocalYmd,
  startOfWeekMonday,
  addDays,
} from '../utils/revenueDateWindows';

describe('revenueDateWindow', () => {
  // Wed Jul 15, 2026 (local)
  const now = new Date(2026, 6, 15);

  it('returns Monday–Sunday for week plus previous week', () => {
    const w = revenueDateWindow(REVENUE_RANGE.WEEK, now);
    expect(w).toEqual({
      fromYmd: '2026-07-13',
      toYmd: '2026-07-19',
      prevFromYmd: '2026-07-06',
      prevToYmd: '2026-07-12',
    });
  });

  it('returns calendar month plus previous month', () => {
    const w = revenueDateWindow(REVENUE_RANGE.MONTH, now);
    expect(w).toEqual({
      fromYmd: '2026-07-01',
      toYmd: '2026-07-31',
      prevFromYmd: '2026-06-01',
      prevToYmd: '2026-06-30',
    });
  });

  it('returns calendar year plus previous year', () => {
    const w = revenueDateWindow(REVENUE_RANGE.YEAR, now);
    expect(w).toEqual({
      fromYmd: '2026-01-01',
      toYmd: '2026-12-31',
      prevFromYmd: '2025-01-01',
      prevToYmd: '2025-12-31',
    });
  });

  it('returns null bounds for all-time (no scheduled_date filter)', () => {
    const w = revenueDateWindow(REVENUE_RANGE.ALL, now);
    expect(w).toEqual({
      fromYmd: null,
      toYmd: null,
      prevFromYmd: null,
      prevToYmd: null,
    });
  });
});

describe('startOfWeekMonday / addDays / parseLocalYmd', () => {
  it('snaps Sunday to the prior Monday', () => {
    const sunday = new Date(2026, 6, 19); // Jul 19 2026
    expect(startOfWeekMonday(sunday)).toEqual(new Date(2026, 6, 13));
  });

  it('parses local YMD without UTC shift', () => {
    const d = parseLocalYmd('2026-07-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(15);
  });

  it('adds days in local calendar', () => {
    expect(addDays(new Date(2026, 6, 31), 1)).toEqual(new Date(2026, 7, 1));
  });
});

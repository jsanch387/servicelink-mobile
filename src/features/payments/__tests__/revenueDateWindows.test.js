import { REVENUE_RANGE } from '../constants/paymentsRevenueRanges';
import {
  revenueDateWindow,
  revenueCustomDateWindow,
  formatRevenueCustomRangeLabel,
  inclusiveDayCount,
  isCompleteCustomRevenueRange,
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

describe('revenueCustomDateWindow', () => {
  it('returns the same-length window immediately before', () => {
    expect(revenueCustomDateWindow('2026-03-03', '2026-03-18')).toEqual({
      fromYmd: '2026-03-03',
      toYmd: '2026-03-18',
      prevFromYmd: '2026-02-15',
      prevToYmd: '2026-03-02',
    });
    expect(inclusiveDayCount('2026-03-03', '2026-03-18')).toBe(16);
  });

  it('treats a single day as a 1-day window', () => {
    expect(revenueCustomDateWindow('2026-07-15', '2026-07-15')).toEqual({
      fromYmd: '2026-07-15',
      toYmd: '2026-07-15',
      prevFromYmd: '2026-07-14',
      prevToYmd: '2026-07-14',
    });
  });

  it('swaps inverted bounds', () => {
    expect(revenueCustomDateWindow('2026-03-18', '2026-03-03')).toEqual({
      fromYmd: '2026-03-03',
      toYmd: '2026-03-18',
      prevFromYmd: '2026-02-15',
      prevToYmd: '2026-03-02',
    });
  });

  it('returns null bounds when either date is missing', () => {
    expect(revenueCustomDateWindow(null, '2026-03-18')).toEqual({
      fromYmd: null,
      toYmd: null,
      prevFromYmd: null,
      prevToYmd: null,
    });
  });
});

describe('formatRevenueCustomRangeLabel', () => {
  it('formats same-month, same-year, and cross-year windows', () => {
    expect(formatRevenueCustomRangeLabel('2026-03-03', '2026-03-18')).toBe('Mar 3–18');
    expect(formatRevenueCustomRangeLabel('2026-03-03', '2026-04-02')).toBe('Mar 3–Apr 2');
    expect(formatRevenueCustomRangeLabel('2025-12-28', '2026-01-04')).toBe(
      'Dec 28, 2025–Jan 4, 2026',
    );
    expect(formatRevenueCustomRangeLabel('2026-03-03', '2026-03-03')).toBe('Mar 3');
  });

  it('requires two different dates for a complete custom range', () => {
    expect(isCompleteCustomRevenueRange('2026-03-03', '2026-03-18')).toBe(true);
    expect(isCompleteCustomRevenueRange('2026-03-03', '2026-03-03')).toBe(false);
    expect(isCompleteCustomRevenueRange('2026-03-03', null)).toBe(false);
    expect(isCompleteCustomRevenueRange(null, null)).toBe(false);
  });
});

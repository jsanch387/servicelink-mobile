import {
  buildMonthWeekGrid,
  parseLocalYyyyMmDd,
  startOfLocalDay,
  toLocalYyyyMmDd,
} from '../calendarDateKey';

describe('calendarDateKey', () => {
  describe('toLocalYyyyMmDd', () => {
    it('formats local calendar date', () => {
      expect(toLocalYyyyMmDd(new Date(2026, 3, 29))).toBe('2026-04-29');
    });

    it('returns empty string for invalid date', () => {
      expect(toLocalYyyyMmDd(new Date(Number.NaN))).toBe('');
    });
  });

  describe('parseLocalYyyyMmDd', () => {
    it('parses valid key to local midnight', () => {
      const d = parseLocalYyyyMmDd('2026-04-29');
      expect(d).not.toBeNull();
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(3);
      expect(d.getDate()).toBe(29);
    });

    it('rejects invalid calendar dates', () => {
      expect(parseLocalYyyyMmDd('2026-02-30')).toBeNull();
    });

    it('rejects malformed keys', () => {
      expect(parseLocalYyyyMmDd('')).toBeNull();
      expect(parseLocalYyyyMmDd('2026/04/29')).toBeNull();
    });
  });

  describe('buildMonthWeekGrid', () => {
    it('pads start of month and omits adjacent-month dates', () => {
      const weeks = buildMonthWeekGrid(2026, 3);
      const flat = weeks.flat();
      const dates = flat.filter(Boolean);
      expect(dates).toHaveLength(30);
      expect(flat[0]).toBeNull();
      expect(dates[0].getDate()).toBe(1);
      expect(dates[dates.length - 1].getDate()).toBe(30);
      expect(flat[flat.length - 1]).toBeNull();
    });

    it('aligns the 1st to the correct weekday column', () => {
      const weeks = buildMonthWeekGrid(2026, 4);
      const mayFirst = weeks.flat().find((d) => d?.getDate() === 1);
      expect(mayFirst).not.toBeNull();
      expect(mayFirst.getDay()).toBe(5);
    });
  });

  describe('startOfLocalDay', () => {
    it('zeros time fields', () => {
      const d = startOfLocalDay(new Date(2026, 0, 15, 14, 30, 45, 999));
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
      expect(d.getSeconds()).toBe(0);
      expect(d.getMilliseconds()).toBe(0);
      expect(d.getDate()).toBe(15);
    });
  });
});

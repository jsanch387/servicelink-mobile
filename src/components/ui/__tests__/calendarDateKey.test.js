import { parseLocalYyyyMmDd, startOfLocalDay, toLocalYyyyMmDd } from '../calendarDateKey';

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

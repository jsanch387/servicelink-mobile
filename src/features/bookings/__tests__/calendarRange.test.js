import { parseLocalYyyyMmDd, toLocalYyyyMmDd } from '../../../components/ui/calendarDateKey';
import {
  getMonthDateRangeKeys,
  getWeekDateRangeKeys,
  weekDaysFromAnchor,
} from '../utils/calendarRange';

describe('calendarRange', () => {
  it('getMonthDateRangeKeys returns inclusive first and last day of month', () => {
    expect(getMonthDateRangeKeys(new Date(2026, 4, 15))).toEqual({
      start: '2026-05-01',
      end: '2026-05-31',
    });
  });

  it('getWeekDateRangeKeys uses Sunday-first week containing anchor', () => {
    const anchor = new Date(2026, 4, 21);
    const { start, end } = getWeekDateRangeKeys(anchor);
    const startDate = parseLocalYyyyMmDd(start);
    const endDate = parseLocalYyyyMmDd(end);
    expect(startDate.getDay()).toBe(0);
    expect(endDate.getDay()).toBe(6);
    expect(startDate.getTime()).toBeLessThanOrEqual(anchor.getTime());
    expect(endDate.getTime()).toBeGreaterThanOrEqual(anchor.getTime());
    const spanDays = Math.round((endDate - startDate) / 86400000);
    expect(spanDays).toBe(6);
  });

  it('weekDaysFromAnchor returns seven local dates including the anchor day', () => {
    const anchor = new Date(2026, 4, 21);
    const days = weekDaysFromAnchor(anchor);
    const anchorKey = toLocalYyyyMmDd(anchor);
    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(0);
    expect(days[6].getDay()).toBe(6);
    expect(days.map(toLocalYyyyMmDd)).toContain(anchorKey);
  });

  it('week range can span month boundary when anchor is near month end', () => {
    const anchor = new Date(2026, 4, 31);
    const { start, end } = getWeekDateRangeKeys(anchor);
    expect(start.slice(0, 7)).toBe('2026-05');
    expect(end.slice(0, 7)).toBe('2026-06');
  });
});

import { formatHeadlineDate, formatTimeRange } from '../utils/formatBookingScheduleHeadline';

describe('formatBookingScheduleHeadline', () => {
  const morning = new Date(2026, 8, 23, 9, 0).getTime();
  const lateMorning = new Date(2026, 8, 23, 11, 30).getTime();

  it('drops the meridiem on the start when both clocks share it', () => {
    expect(formatTimeRange(morning, 60)).toBe('9:00 – 10:00 AM');
  });

  it('keeps both meridiems when the visit crosses noon', () => {
    expect(formatTimeRange(lateMorning, 90)).toBe('11:30 AM – 1:00 PM');
  });

  it('shows only the start when duration is missing', () => {
    expect(formatTimeRange(morning, 0)).toBe('9:00 AM');
    expect(formatTimeRange(Number.NaN, 60)).toBe('');
  });

  it('adds the year when the visit is not this year', () => {
    const sameYear = formatHeadlineDate(morning, new Date(2026, 10, 7).getTime());
    const nextYear = formatHeadlineDate(morning, new Date(2027, 0, 1).getTime());
    expect(sameYear).toMatch(/Wed/);
    expect(sameYear).not.toMatch(/2026/);
    expect(nextYear).toMatch(/2026/);
  });
});

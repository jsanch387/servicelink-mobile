import { formatCustomerLastVisitDate } from '../customer-details/utils/formatCustomerLastVisitDate';

describe('formatCustomerLastVisitDate', () => {
  it('uses short month for September (not full "September")', () => {
    const s = formatCustomerLastVisitDate(new Date('2026-09-24T12:00:00.000Z'));
    expect(s.toLowerCase()).not.toContain('september');
    expect(s).toMatch(/sep/i);
    expect(s).toMatch(/24/);
    expect(s).toMatch(/2026/);
  });

  it('accepts ISO strings', () => {
    const s = formatCustomerLastVisitDate('2026-10-08T00:00:00.000Z');
    expect(s.toLowerCase()).not.toContain('october');
    expect(s).toMatch(/oct/i);
  });

  it('returns em dash for invalid input', () => {
    expect(formatCustomerLastVisitDate(null)).toBe('—');
    expect(formatCustomerLastVisitDate(undefined)).toBe('—');
    expect(formatCustomerLastVisitDate('not-a-date')).toBe('—');
  });
});

import {
  formatDaysSinceLastVisitCompact,
  formatDaysSinceLastVisit,
  formatDaysSinceLastVisitInline,
} from '../customer-details/utils/formatDaysSinceLastVisit';

describe('formatDaysSinceLastVisit', () => {
  const noon = (y, m0, d) => new Date(y, m0, d, 12, 0, 0);

  it('returns Today when same calendar day', () => {
    const visit = noon(2026, 3, 22);
    const now = noon(2026, 3, 22);
    expect(formatDaysSinceLastVisit(visit, now)).toBe('Today');
  });

  it('returns Yesterday', () => {
    const visit = noon(2026, 3, 21);
    const now = noon(2026, 3, 22);
    expect(formatDaysSinceLastVisit(visit, now)).toBe('Yesterday');
  });

  it('returns N days ago', () => {
    const visit = noon(2026, 3, 2); // Apr 2
    const now = noon(2026, 3, 22); // Apr 22
    expect(formatDaysSinceLastVisit(visit, now)).toBe('20 days ago');
  });

  it('returns in N days for future visit date', () => {
    const visit = noon(2026, 8, 24);
    const now = noon(2026, 3, 22);
    expect(formatDaysSinceLastVisit(visit, now)).toBe('in 155 days');
  });

  it('returns empty string for invalid visit', () => {
    expect(formatDaysSinceLastVisit('bad', noon(2026, 3, 22))).toBe('');
  });
});

describe('formatDaysSinceLastVisitInline', () => {
  const noon = (y, m0, d) => new Date(y, m0, d, 12, 0, 0);

  it('drops " ago" for past multi-day gaps', () => {
    const visit = noon(2026, 3, 2);
    const now = noon(2026, 3, 22);
    expect(formatDaysSinceLastVisitInline(visit, now)).toBe('20 days');
  });

  it('keeps Today and Yesterday', () => {
    expect(formatDaysSinceLastVisitInline(noon(2026, 3, 22), noon(2026, 3, 22))).toBe('Today');
    expect(formatDaysSinceLastVisitInline(noon(2026, 3, 21), noon(2026, 3, 22))).toBe('Yesterday');
  });
});

describe('formatDaysSinceLastVisitCompact', () => {
  const noon = (y, m0, d) => new Date(y, m0, d, 12, 0, 0);

  it('returns compact past copy like 19d ago', () => {
    expect(formatDaysSinceLastVisitCompact(noon(2026, 3, 3), noon(2026, 3, 22))).toBe('19d ago');
  });

  it('returns 0d ago when same day', () => {
    expect(formatDaysSinceLastVisitCompact(noon(2026, 3, 22), noon(2026, 3, 22))).toBe('0d ago');
  });
});

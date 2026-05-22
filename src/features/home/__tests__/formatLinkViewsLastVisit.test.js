import { formatLinkViewsLastVisit } from '../utils/formatLinkViewsLastVisit';

const NOW = new Date('2026-05-21T12:00:00.000Z').getTime();

describe('formatLinkViewsLastVisit', () => {
  it('returns Never when missing or invalid', () => {
    expect(formatLinkViewsLastVisit(null, NOW)).toBe('Never');
    expect(formatLinkViewsLastVisit('not-a-date', NOW)).toBe('Never');
  });

  it('returns Just now under 2 minutes', () => {
    expect(formatLinkViewsLastVisit('2026-05-21T11:59:30.000Z', NOW)).toBe('Just now');
  });

  it('returns compact minutes under an hour', () => {
    expect(formatLinkViewsLastVisit('2026-05-21T11:30:00.000Z', NOW)).toBe('30m ago');
  });

  it('returns hr or hrs under a day', () => {
    expect(formatLinkViewsLastVisit('2026-05-21T11:00:00.000Z', NOW)).toBe('1hr ago');
    expect(formatLinkViewsLastVisit('2026-05-21T06:00:00.000Z', NOW)).toBe('6hrs ago');
  });

  it('returns compact days under 7 days', () => {
    expect(formatLinkViewsLastVisit('2026-05-18T12:00:00.000Z', NOW)).toBe('3d ago');
  });

  it('returns short date for older visits', () => {
    const label = formatLinkViewsLastVisit('2026-04-01T12:00:00.000Z', NOW);
    expect(label).toMatch(/Apr/);
    expect(label).toMatch(/1/);
  });
});

import { formatReviewDateLabel } from '../formatReviewDateLabel';

describe('formatReviewDateLabel', () => {
  it('formats ISO timestamps for display', () => {
    const label = formatReviewDateLabel('2026-06-01T12:00:00.000Z');
    expect(label).toMatch(/Jun/);
    expect(label).toMatch(/2026/);
  });

  it('returns empty string for invalid input', () => {
    expect(formatReviewDateLabel('')).toBe('');
    expect(formatReviewDateLabel(null)).toBe('');
  });
});

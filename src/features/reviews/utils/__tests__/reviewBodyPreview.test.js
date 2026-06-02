import { getCollapsedReviewBody, isReviewBodyTruncatable } from '../reviewBodyPreview';

describe('reviewBodyPreview', () => {
  it('detects when body exceeds the cap', () => {
    expect(isReviewBodyTruncatable('short', 20)).toBe(false);
    expect(isReviewBodyTruncatable('a'.repeat(21), 20)).toBe(true);
  });

  it('returns full body when under the cap', () => {
    expect(getCollapsedReviewBody('  hello world  ', 50)).toBe('hello world');
  });

  it('truncates long body with an ellipsis', () => {
    const body =
      'Really loved the experience. My car looks brand new and I will absolutely book again for every season.';
    const preview = getCollapsedReviewBody(body, 40);
    expect(preview.endsWith('…')).toBe(true);
    expect(preview.length).toBeLessThan(body.length);
  });
});

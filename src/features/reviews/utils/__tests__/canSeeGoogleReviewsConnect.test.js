import { GOOGLE_REVIEWS_EARLY_ACCESS_EMAILS } from '../../constants/googleReviewsFeatureFlags';
import { canSeeGoogleReviewsConnect } from '../canSeeGoogleReviewsConnect';

const ALLOWLIST = ['jesuss387@gmail.com'];

describe('canSeeGoogleReviewsConnect', () => {
  it('is open to every login', () => {
    expect(GOOGLE_REVIEWS_EARLY_ACCESS_EMAILS).toEqual([]);
    expect(canSeeGoogleReviewsConnect('owner@example.com')).toBe(true);
    expect(canSeeGoogleReviewsConnect('jesuss387@gmail.com')).toBe(true);
  });

  it('shows the card for the allowlisted login', () => {
    expect(canSeeGoogleReviewsConnect('jesuss387@gmail.com', ALLOWLIST)).toBe(true);
    expect(canSeeGoogleReviewsConnect('JESUSS387@gmail.com', ALLOWLIST)).toBe(true);
    expect(canSeeGoogleReviewsConnect('  jesuss387@gmail.com  ', ALLOWLIST)).toBe(true);
  });

  it('hides the card from every other login', () => {
    expect(canSeeGoogleReviewsConnect('owner@example.com', ALLOWLIST)).toBe(false);
    expect(canSeeGoogleReviewsConnect('', ALLOWLIST)).toBe(false);
    expect(canSeeGoogleReviewsConnect(null, ALLOWLIST)).toBe(false);
  });

  it('opens the card to every login when the allowlist is empty', () => {
    expect(canSeeGoogleReviewsConnect('owner@example.com', [])).toBe(true);
    expect(canSeeGoogleReviewsConnect(null, [])).toBe(true);
  });
});

import {
  REVIEWS_FILTER_ALL,
  REVIEWS_FILTER_NEEDS_REPLY,
  REVIEWS_FILTER_REPLIED,
  REVIEWS_PREVIEW_REVIEWS,
} from '../../constants';
import { filterPreviewReviews } from '../filterPreviewReviews';

describe('filterPreviewReviews', () => {
  it('returns all reviews for the All filter', () => {
    expect(filterPreviewReviews(REVIEWS_PREVIEW_REVIEWS, REVIEWS_FILTER_ALL)).toHaveLength(3);
  });

  it('returns only reviews that need a reply', () => {
    const result = filterPreviewReviews(REVIEWS_PREVIEW_REVIEWS, REVIEWS_FILTER_NEEDS_REPLY);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.replyStatus === REVIEWS_FILTER_NEEDS_REPLY)).toBe(true);
  });

  it('returns only replied reviews', () => {
    const result = filterPreviewReviews(REVIEWS_PREVIEW_REVIEWS, REVIEWS_FILTER_REPLIED);
    expect(result).toHaveLength(1);
    expect(result[0].replyStatus).toBe(REVIEWS_FILTER_REPLIED);
  });
});

import {
  REVIEWS_FILTER_ALL,
  REVIEWS_FILTER_NEEDS_REPLY,
  REVIEWS_FILTER_REPLIED,
} from '../constants';

/**
 * @param {typeof import('../constants').REVIEWS_PREVIEW_REVIEWS} reviews
 * @param {string} filterKey
 */
export function filterPreviewReviews(reviews, filterKey) {
  if (filterKey === REVIEWS_FILTER_ALL) return reviews;
  if (filterKey === REVIEWS_FILTER_NEEDS_REPLY) {
    return reviews.filter((r) => r.replyStatus === REVIEWS_FILTER_NEEDS_REPLY);
  }
  if (filterKey === REVIEWS_FILTER_REPLIED) {
    return reviews.filter((r) => r.replyStatus === REVIEWS_FILTER_REPLIED);
  }
  return reviews;
}

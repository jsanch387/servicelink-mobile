import { REVIEWS_FILTER_NEEDS_REPLY } from '../constants';

/**
 * @param {import('./reviewModel').ReviewListItem[]} reviews
 * @param {string} filterKey
 */
export function filterReviews(reviews, filterKey) {
  if (filterKey === REVIEWS_FILTER_NEEDS_REPLY) {
    return reviews.filter((review) => review.replyStatus === REVIEWS_FILTER_NEEDS_REPLY);
  }
  return reviews;
}

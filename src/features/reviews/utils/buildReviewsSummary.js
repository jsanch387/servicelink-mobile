import { REVIEWS_EMPTY_SUMMARY } from '../constants';

/**
 * @param {{ rating: number }[]} reviews
 */
export function buildReviewsSummary(reviews) {
  if (reviews.length === 0) return REVIEWS_EMPTY_SUMMARY;

  const totalCount = reviews.length;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalCount;
  const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach((review) => {
    const rounded = Math.max(1, Math.min(5, Math.round(review.rating)));
    starCounts[rounded] += 1;
  });

  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    percent: Math.round((starCounts[stars] / totalCount) * 100),
  }));

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalCount,
    breakdown,
  };
}

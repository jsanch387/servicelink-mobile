import { REVIEWS_EMPTY_SUMMARY } from '../constants';

/**
 * Star average from `GET /api/reviews`. That summary is ServiceLink-only.
 *
 * @param {unknown} summary
 */
export function mapDashboardSummary(summary) {
  if (!summary || typeof summary !== 'object') return REVIEWS_EMPTY_SUMMARY;

  const record = /** @type {Record<string, unknown>} */ (summary);
  const breakdown = Array.isArray(record.breakdown)
    ? record.breakdown
        .filter((row) => row && typeof row === 'object' && typeof row.stars === 'number')
        .map((row) => ({
          stars: row.stars,
          percent: typeof row.percent === 'number' ? row.percent : 0,
        }))
    : [];

  return {
    averageRating: typeof record.averageRating === 'number' ? record.averageRating : 0,
    totalCount: typeof record.reviewCount === 'number' ? record.reviewCount : 0,
    breakdown: breakdown.length > 0 ? breakdown : REVIEWS_EMPTY_SUMMARY.breakdown,
  };
}

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

/** Revenue time ranges for Payments → Revenue. */
export const REVENUE_RANGE = Object.freeze({
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  ALL: 'all',
});

export const REVENUE_RANGE_OPTIONS = Object.freeze([
  { id: REVENUE_RANGE.WEEK, label: 'Week' },
  { id: REVENUE_RANGE.MONTH, label: 'Month' },
  { id: REVENUE_RANGE.YEAR, label: 'Year' },
  { id: REVENUE_RANGE.ALL, label: 'All time' },
]);

/**
 * Quiet caption under the amount when the selected range has $0.
 * Prefer letting zeros + chart tell the story — avoid “no jobs this month” banners.
 */
export const REVENUE_EMPTY_CAPTION = 'Finish a job and it shows up here.';

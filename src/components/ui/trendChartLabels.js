/** Enough room for `Jun 25` at the chart’s 11px axis type. */
export const TREND_CHART_LABEL_SLOT = 56;

/**
 * First + last, then evenly spaced ticks that fit `width` without neighbors colliding.
 *
 * @param {number} count
 * @param {number} width
 * @param {number} [slotWidth]
 * @returns {number[]}
 */
export function pickTrendChartLabelIndexes(count, width, slotWidth = TREND_CHART_LABEL_SLOT) {
  if (count <= 0) return [];
  if (count === 1) return [0];

  const maxLabels = Math.max(2, Math.floor(Math.max(width, 1) / slotWidth));
  if (count <= maxLabels) {
    return Array.from({ length: count }, (_, index) => index);
  }

  const stride = Math.ceil((count - 1) / (maxLabels - 1));
  const indexes = [];
  for (let index = 0; index < count - 1; index += stride) {
    indexes.push(index);
  }
  const last = count - 1;
  if (indexes[indexes.length - 1] === last - 1) {
    indexes.pop();
  }
  indexes.push(last);
  return indexes;
}

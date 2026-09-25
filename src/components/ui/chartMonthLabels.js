export const CHART_MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Axis tick — always the short month.
 *
 * @param {number} monthIndex
 */
export function chartMonthTick(monthIndex) {
  return CHART_MONTH_SHORT[monthIndex] ?? '';
}

/**
 * Tooltip copy — short month plus year when the user scrubs a point.
 *
 * @param {number} monthIndex
 * @param {number} [year]
 */
export function chartMonthTooltip(monthIndex, year) {
  const month = chartMonthTick(monthIndex);
  if (year == null || !Number.isFinite(year)) return month;
  return `${month} ${year}`;
}

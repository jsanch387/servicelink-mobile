/**
 * Compact last-visit label for narrow stat columns (e.g. "Sep 24, 2026" instead of "September 24, 2026").
 * Uses the device locale with a short month to avoid overflow in "At a glance".
 *
 * @param {Date | string | number | null | undefined} input
 * @returns {string}
 */
export function formatCustomerLastVisitDate(input) {
  if (input == null) {
    return '—';
  }
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

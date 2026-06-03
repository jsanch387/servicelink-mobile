/**
 * @param {string | null | undefined} isoString
 */
export function formatReviewDateLabel(isoString) {
  if (typeof isoString !== 'string' || !isoString.trim()) return '';

  const ms = Date.parse(isoString);
  if (Number.isNaN(ms)) return '';

  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

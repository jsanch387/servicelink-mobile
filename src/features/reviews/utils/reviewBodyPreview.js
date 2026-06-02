/**
 * @param {string} body
 * @param {number} maxChars
 */
export function isReviewBodyTruncatable(body, maxChars) {
  return body.trim().length > maxChars;
}

/**
 * Collapsed preview — trims at a word boundary when possible and appends an ellipsis.
 *
 * @param {string} body
 * @param {number} maxChars
 */
export function getCollapsedReviewBody(body, maxChars) {
  const trimmed = body.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const slice = trimmed.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > Math.floor(maxChars * 0.55) ? slice.slice(0, lastSpace) : slice.trimEnd();

  return `${cut.trimEnd()}…`;
}

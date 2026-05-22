const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Compact relative time for the link-views card (e.g. `59m`, `3hrs`, `2d`).
 *
 * @param {string | null | undefined} iso
 * @param {number} [nowMs]
 * @returns {string}
 */
export function formatLinkViewsLastVisit(iso, nowMs = Date.now()) {
  if (!iso) {
    return 'Never';
  }
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) {
    return 'Never';
  }
  const diff = Math.max(0, nowMs - at);
  if (diff < 2 * MINUTE_MS) {
    return 'Just now';
  }
  if (diff < HOUR_MS) {
    const n = Math.floor(diff / MINUTE_MS);
    return `${n}m ago`;
  }
  if (diff < DAY_MS) {
    const n = Math.floor(diff / HOUR_MS);
    return n === 1 ? '1hr ago' : `${n}hrs ago`;
  }
  if (diff < 7 * DAY_MS) {
    const n = Math.floor(diff / DAY_MS);
    return `${n}d ago`;
  }
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

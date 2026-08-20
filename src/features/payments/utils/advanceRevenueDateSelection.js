/**
 * Airbnb-style date range tap: start then a different end day; tap again to restart.
 * @param {string | null} rangeStartKey
 * @param {string | null} rangeEndKey
 * @param {string} tappedKey
 * @returns {{ startKey: string | null; endKey: string | null }}
 */
export function advanceRevenueDateSelection(rangeStartKey, rangeEndKey, tappedKey) {
  const tapped = String(tappedKey ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tapped)) {
    return { startKey: rangeStartKey, endKey: rangeEndKey };
  }

  if (!rangeStartKey) {
    return { startKey: tapped, endKey: null };
  }

  if (!rangeEndKey) {
    if (tapped === rangeStartKey) {
      return { startKey: null, endKey: null };
    }
    if (tapped < rangeStartKey) {
      return { startKey: tapped, endKey: rangeStartKey };
    }
    return { startKey: rangeStartKey, endKey: tapped };
  }

  return { startKey: tapped, endKey: null };
}

/**
 * Display label for mobile service area from Details tab fields (UI preview only for now).
 * @param {string | undefined} city
 * @param {string | undefined} state
 * @param {string | undefined} zip
 * @returns {string | null}
 */
export function formatBookingServiceAreaLabel(city, state, zip) {
  const c = String(city ?? '').trim();
  const s = String(state ?? '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 2)
    .toUpperCase();
  const z = String(zip ?? '')
    .replace(/\D/g, '')
    .slice(0, 5);

  if (c && s && z) {
    return `${c}, ${s} ${z}`;
  }
  if (c && s) {
    return `${c}, ${s}`;
  }
  if (c) {
    return c;
  }
  if (s && z) {
    return `${s} ${z}`;
  }
  if (s) {
    return s;
  }
  if (z) {
    return z;
  }
  return null;
}

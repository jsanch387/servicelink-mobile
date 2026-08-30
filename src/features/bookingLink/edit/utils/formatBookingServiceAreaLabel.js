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

/**
 * Web coverage label — city/state plus travel distance, e.g. `"Austin, TX · 25 mi"`.
 * @param {string | undefined} city
 * @param {string | undefined} state
 * @param {string | number | null | undefined} radiusMiles
 * @returns {string | null}
 */
export function formatServiceCoverageLabel(city, state, radiusMiles) {
  const area = formatBookingServiceAreaLabel(city, state);
  if (!area) return null;
  const miles = Number(radiusMiles);
  if (!Number.isFinite(miles) || miles <= 0) return area;
  return `${area} · ${Math.round(miles)} mi`;
}

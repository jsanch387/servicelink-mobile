/**
 * Parse `service_area` like `"Austin, TX"` into `[city, state]` for edit forms.
 * @param {string | null | undefined} serviceArea
 * @returns {[string, string]}
 */
export function splitServiceAreaCityState(serviceArea) {
  const text = String(serviceArea ?? '').trim();
  if (!text) return ['', ''];
  const parts = text
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts[1]];
  return [text, ''];
}

/**
 * Build `business_profiles.service_area` from city + state (e.g. "Austin, TX").
 * @param {string | null | undefined} city
 * @param {string | null | undefined} state
 * @returns {string | null}
 */
export function buildServiceArea(city, state) {
  const c = String(city ?? '').trim();
  const s = String(state ?? '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 2)
    .toUpperCase();
  if (c && s) {
    return `${c}, ${s}`;
  }
  if (c) {
    return c;
  }
  if (s) {
    return s;
  }
  return null;
}

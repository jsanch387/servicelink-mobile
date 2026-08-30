import { formatLocationDisplayLabel } from '../../location/api/mapTilerGeocoding';

/**
 * @param {unknown} state
 * @returns {string}
 */
function normalizeState(state) {
  return String(state ?? '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * @param {unknown} zip
 * @returns {string}
 */
function normalizeZip(zip) {
  return String(zip ?? '')
    .replace(/\D/g, '')
    .slice(0, 5);
}

/**
 * Single-line shop address for the search field and saved picks.
 * @param {string | null | undefined} street
 * @param {string | null | undefined} city
 * @param {string | null | undefined} state
 * @param {string | null | undefined} zip
 * @returns {string}
 */
export function formatShopAddressLabel(street, city, state, zip) {
  const line = String(street ?? '').trim();
  if (!line) return '';
  const cityName = String(city ?? '').trim();
  const stateCode = normalizeState(state);
  if (!cityName || !stateCode) return line;
  return `${line}, ${formatLocationDisplayLabel(cityName, stateCode, normalizeZip(zip))}`;
}

/**
 * Treat a saved street as a selected place so the field does not force a re-pick.
 * @param {{
 *   street?: string | null,
 *   city?: string | null,
 *   state?: string | null,
 *   zip?: string | null,
 * }} args
 * @returns {import('../../location/types/location').StructuredLocation | null}
 */
export function buildSavedShopLocation({ street, city, state, zip }) {
  const line = String(street ?? '').trim();
  if (!line) return null;
  const cityName = String(city ?? '').trim();
  const stateCode = normalizeState(state);
  const zipCode = normalizeZip(zip);
  const label = formatShopAddressLabel(line, cityName, stateCode, zipCode);
  return {
    providerId: 'saved-shop',
    label,
    searchValue: label,
    street: line,
    city: cityName,
    state: stateCode,
    zip: zipCode,
    latitude: 0,
    longitude: 0,
    placeType: 'address',
  };
}

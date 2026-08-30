import { formatLocationDisplayLabel, hasMapTilerApiKey } from '../api/mapTilerGeocoding';
import { searchLocations } from '../services/locationAutocomplete';

/**
 * Best MapTiler match for a legacy city/state/ZIP so we can write `business_service_areas`.
 *
 * @param {{
 *   city?: string;
 *   state?: string;
 *   zip?: string;
 *   signal?: AbortSignal;
 * }} input
 * @returns {Promise<import('../types/location').StructuredLocation | null>}
 */
export async function resolveLegacyServiceLocation({ city, state, zip, signal } = {}) {
  const nextCity = String(city ?? '').trim();
  const nextState = String(state ?? '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 2)
    .toUpperCase();
  const nextZip = String(zip ?? '')
    .replace(/\D/g, '')
    .slice(0, 5);

  if (!nextCity || !nextState || !hasMapTilerApiKey()) return null;

  const query = formatLocationDisplayLabel(nextCity, nextState, nextZip);
  if (query.trim().length < 3) return null;

  try {
    const results = await searchLocations(query, { mode: 'service-origin', signal });
    if (!results.length) return null;

    const exact = results.find(
      (location) =>
        location.city.trim().toLowerCase() === nextCity.toLowerCase() &&
        location.state.trim().toUpperCase() === nextState,
    );

    return exact ?? results[0] ?? null;
  } catch (error) {
    if (error?.name === 'AbortError') return null;
    return null;
  }
}

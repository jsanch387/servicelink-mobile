/**
 * Location autocomplete service — MapTiler-backed (web-aligned).
 */

import {
  formatLocationDisplayLabel,
  formatLocationSuggestionKind,
  hasMapTilerApiKey,
  searchMapTilerLocations,
} from '../api/mapTilerGeocoding';

/**
 * @typedef {import('../types/location').StructuredLocation} LocationResult
 */

/**
 * Search for location suggestions via MapTiler.
 * @param {string} query
 * @param {{ mode?: import('../types/location').LocationAutocompleteMode, signal?: AbortSignal }} [options]
 * @returns {Promise<LocationResult[]>}
 */
export async function searchLocations(query, options = {}) {
  const { mode = 'service-origin', signal } = options;
  if (!hasMapTilerApiKey()) {
    throw new Error('Location suggestions are not configured.');
  }
  return searchMapTilerLocations(query, mode, signal);
}

/**
 * @param {LocationResult} result
 * @returns {string}
 */
export function formatLocationDisplay(result) {
  if (result.label?.trim()) return result.label.trim();
  return formatLocationDisplayLabel(result.city, result.state, result.zip ?? '');
}

/**
 * @param {LocationResult} result
 * @returns {{ city: string, state: string, country: string, zip: string }}
 */
export function parseLocationResult(result) {
  return {
    city: result.city,
    state: result.state,
    country: 'US',
    zip: result.zip,
  };
}

export {
  formatLocationDisplayLabel,
  formatLocationSuggestionKind,
  hasMapTilerApiKey,
  searchMapTilerLocations,
};

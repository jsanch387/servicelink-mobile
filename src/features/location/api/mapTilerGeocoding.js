/**
 * MapTiler Geocoding API client (aligned with web business-profile).
 * Uses EXPO_PUBLIC_MAPTILER_API_KEY.
 */

const MAPTILER_GEOCODING_URL = 'https://api.maptiler.com/geocoding';
const SEARCH_CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_SEARCH_CACHE_ENTRIES = 100;

/** @type {Map<string, { locations: import('../types/location').StructuredLocation[], expiresAt: number }>} */
const searchCache = new Map();

const US_STATE_ABBREVIATIONS = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
};

/**
 * @param {{ id?: string, place_type?: string[] }} item
 */
function itemType(item) {
  return item.place_type?.[0] ?? item.id?.split('.')[0] ?? '';
}

/**
 * @param {{ id?: string, text?: string, place_type?: string[], short_code?: string, properties?: object, context?: object[] }} feature
 * @param {string[]} types
 */
function findHierarchyItem(feature, types) {
  const items = [feature, ...(feature.context ?? [])];
  for (const type of types) {
    const match = items.find((item) => itemType(item) === type);
    if (match) return match;
  }
  return undefined;
}

/**
 * @param {{ text?: string, short_code?: string, properties?: { short_code?: string } } | undefined} item
 */
function stateAbbreviation(item) {
  if (!item) return '';
  const shortCode = item.short_code ?? item.properties?.short_code ?? '';
  const codeFromProvider = shortCode.split('-').at(-1)?.toUpperCase() ?? '';
  if (/^[A-Z]{2}$/.test(codeFromProvider)) return codeFromProvider;
  return US_STATE_ABBREVIATIONS[item.text] ?? '';
}

/**
 * @param {string} city
 * @param {string} state
 * @param {string} zip
 */
export function formatLocationDisplayLabel(city, state, zip) {
  const cityState = `${city}, ${state}`;
  return zip ? `${cityState} ${zip}` : cityState;
}

/**
 * User-facing suggestion hint — never show MapTiler jargon like "municipality".
 * @param {string} placeType
 */
export function formatLocationSuggestionKind(placeType) {
  switch (placeType) {
    case 'postal_code':
      return 'ZIP code';
    case 'address':
      return 'Address';
    case 'neighborhood':
    case 'neighbourhood':
      return 'Neighborhood';
    case 'place':
    case 'municipality':
    case 'locality':
    case 'municipal_district':
    default:
      return 'City';
  }
}

/**
 * @param {{
 *   id: string;
 *   place_name?: string;
 *   place_type: string[];
 *   center: [number, number];
 *   text?: string;
 *   short_code?: string;
 *   properties?: object;
 *   context?: object[];
 * }} feature
 * @returns {import('../types/location').StructuredLocation | null}
 */
function mapFeature(feature) {
  const cityItem = findHierarchyItem(feature, [
    'place',
    'municipality',
    'locality',
    'municipal_district',
  ]);
  const regionItem = findHierarchyItem(feature, ['region']);
  const zipItem = findHierarchyItem(feature, ['postal_code']);
  const city = cityItem?.text?.trim() ?? '';
  const state = stateAbbreviation(regionItem);
  const zipMatch = zipItem?.text?.match(/\b\d{5}\b/);
  const zip = zipMatch?.[0] ?? '';
  const longitude = feature.center?.[0];
  const latitude = feature.center?.[1];

  if (!city || !state || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const displayLabel = formatLocationDisplayLabel(city, state, zip);

  return {
    providerId: feature.id,
    label: displayLabel,
    searchValue: displayLabel,
    city,
    state,
    zip,
    latitude,
    longitude,
    placeType: feature.place_type?.[0] ?? itemType(feature),
  };
}

function getMapTilerApiKey() {
  return String(process.env.EXPO_PUBLIC_MAPTILER_API_KEY ?? '').trim();
}

export function hasMapTilerApiKey() {
  return Boolean(getMapTilerApiKey());
}

/**
 * @param {string} query
 * @param {string} [mode]
 */
function searchCacheKey(query, mode = 'service-origin') {
  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${mode}:${normalizedQuery}`;
}

/**
 * @param {string} key
 * @returns {import('../types/location').StructuredLocation[] | null}
 */
function getCachedLocations(key) {
  const cached = searchCache.get(key);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    searchCache.delete(key);
    return null;
  }

  searchCache.delete(key);
  searchCache.set(key, cached);
  return cached.locations;
}

/**
 * @param {string} key
 * @param {import('../types/location').StructuredLocation[]} locations
 */
function cacheLocations(key, locations) {
  searchCache.set(key, {
    locations,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });

  while (searchCache.size > MAX_SEARCH_CACHE_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (!oldestKey) break;
    searchCache.delete(oldestKey);
  }
}

/**
 * @param {string} path
 * @param {URLSearchParams} params
 * @param {AbortSignal} [signal]
 * @returns {Promise<import('../types/location').StructuredLocation[]>}
 */
async function fetchMapTilerLocations(path, params, signal) {
  const response = await fetch(`${MAPTILER_GEOCODING_URL}/${path}.json?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error('Location suggestions are unavailable.');
  }

  const result = await response.json();
  return (result.features ?? []).flatMap((feature) => {
    const location = mapFeature(feature);
    return location ? [location] : [];
  });
}

/**
 * Search US city / ZIP locations via MapTiler autocomplete (service-area mode).
 * @param {string} query
 * @param {string} [mode='service-origin']
 * @param {AbortSignal} [signal]
 * @returns {Promise<import('../types/location').StructuredLocation[]>}
 */
export async function searchMapTilerLocations(query, mode = 'service-origin', signal) {
  const apiKey = getMapTilerApiKey();
  if (!apiKey) throw new Error('MapTiler API key is not configured.');

  const cacheKey = searchCacheKey(query, mode);
  const cachedLocations = getCachedLocations(cacheKey);
  if (cachedLocations) return cachedLocations;

  const params = new URLSearchParams({
    key: apiKey,
    country: 'us',
    language: 'en',
    autocomplete: 'true',
    limit: '5',
    // Prefer city / ZIP centers for service areas (not street addresses).
    types: 'place,municipality,locality,postal_code',
  });

  const locations = await fetchMapTilerLocations(encodeURIComponent(query.trim()), params, signal);

  cacheLocations(cacheKey, locations);
  return locations;
}

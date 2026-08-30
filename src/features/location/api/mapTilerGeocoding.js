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
 * US ZIP from a MapTiler / Mapbox-style geocoding feature.
 * Provider ids are often `postcode.*` even when docs say `postal_code`.
 *
 * @param {{
 *   text?: string;
 *   place_name?: string;
 *   properties?: { postcode?: string; postal_code?: string; postalcode?: string };
 *   context?: object[];
 *   id?: string;
 *   place_type?: string[];
 * } | null | undefined} feature
 * @returns {string}
 */
export function zipFromMapTilerFeature(feature) {
  if (!feature) return '';

  const zipItem = findHierarchyItem(feature, ['postal_code', 'postcode', 'postalcode']);
  const fromHierarchy = String(`${zipItem?.text ?? ''} ${zipItem?.id ?? ''}`).match(/\b\d{5}\b/)?.[0];
  if (fromHierarchy) return fromHierarchy;

  const props = feature.properties ?? {};
  const fromProps = String(props.postcode ?? props.postal_code ?? props.postalcode ?? '').match(
    /\b\d{5}\b/,
  )?.[0];
  if (fromProps) return fromProps;

  return String(feature.place_name ?? '').match(/\b\d{5}\b/)?.[0] ?? '';
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
    case 'postcode':
    case 'postalcode':
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
 * Street line for address-type features (house number + street name).
 * @param {{ address?: string; text?: string; place_type?: string[]; place_name?: string }} feature
 */
function streetFromFeature(feature) {
  const placeType = feature.place_type?.[0] ?? itemType(feature);
  if (placeType !== 'address') return '';
  const house = String(feature.address ?? '').trim();
  const streetName = String(feature.text ?? '').trim();
  const combined = [house, streetName].filter(Boolean).join(' ').trim();
  if (combined) return combined.slice(0, 200);
  const placeName = String(feature.place_name ?? '').trim();
  if (!placeName) return '';
  return placeName.split(',')[0]?.trim().slice(0, 200) ?? '';
}

/**
 * @param {{
 *   id: string;
 *   place_name?: string;
 *   place_type: string[];
 *   center: [number, number];
 *   text?: string;
 *   address?: string;
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
  const city = cityItem?.text?.trim() ?? '';
  const state = stateAbbreviation(regionItem);
  const zip = zipFromMapTilerFeature(feature);
  const longitude = feature.center?.[0];
  const latitude = feature.center?.[1];
  const street = streetFromFeature(feature);

  if (!city || !state || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const cityStateZip = formatLocationDisplayLabel(city, state, zip);
  const displayLabel = street ? `${street}, ${cityStateZip}` : cityStateZip;

  return {
    providerId: feature.id,
    label: displayLabel,
    searchValue: displayLabel,
    street,
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
 * @param {import('../types/location').LocationAutocompleteMode | string} mode
 */
function mapTilerTypesForMode(mode) {
  if (mode === 'customer-address' || mode === 'customer-search') {
    return 'address,place,municipality,locality,postal_code';
  }
  // Prefer city / ZIP centers for service areas (not street addresses).
  return 'place,municipality,locality,postal_code';
}

/**
 * Search US locations via MapTiler autocomplete.
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
    types: mapTilerTypesForMode(mode),
  });

  const locations = await fetchMapTilerLocations(encodeURIComponent(query.trim()), params, signal);

  cacheLocations(cacheKey, locations);
  return locations;
}

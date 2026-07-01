/**
 * Parse `service_area` (e.g. `"Austin, TX"`) into city and state.
 * Legacy rows may include ZIP in the state segment (`"TX 78701"`); ZIP is stripped here.
 * @param {string | null | undefined} serviceArea
 * @returns {{ city: string, state: string }}
 */
export function parseServiceAreaCityState(serviceArea) {
  const text = String(serviceArea ?? '').trim();
  if (!text) {
    return { city: '', state: '' };
  }

  const parts = text
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return { city: text, state: '' };
  }

  const city = parts[0];
  const statePart = parts[1];
  const stateMatch = statePart.match(/^([A-Za-z]{2})/);

  return {
    city,
    state: (stateMatch?.[1] ?? statePart)
      .replace(/[^a-z]/gi, '')
      .slice(0, 2)
      .toUpperCase(),
  };
}

/**
 * @param {string | null | undefined} serviceArea
 * @returns {[string, string]}
 */
export function splitServiceAreaCityState(serviceArea) {
  const { city, state } = parseServiceAreaCityState(serviceArea);
  return [city, state];
}

/** @deprecated Use {@link parseServiceAreaCityState} — ZIP lives on `business_zip`. */
export function splitServiceAreaFields(serviceArea) {
  const { city, state } = parseServiceAreaCityState(serviceArea);
  return { city, state, zip: '' };
}

/**
 * Build `business_profiles.service_area` from city + state (e.g. `"Austin, TX"`).
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

/** @param {string | null | undefined} raw */
export function normalizeBusinessZip(raw) {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .slice(0, 5);
}

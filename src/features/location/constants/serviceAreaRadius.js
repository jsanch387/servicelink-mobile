export const SERVICE_AREA_RADIUS_OPTIONS = [
  { label: '5 miles', value: '5' },
  { label: '10 miles', value: '10' },
  { label: '15 miles', value: '15' },
  { label: '20 miles', value: '20' },
  { label: '25 miles', value: '25' },
  { label: '30 miles', value: '30' },
  { label: '40 miles', value: '40' },
  { label: '50 miles', value: '50' },
  { label: '75 miles', value: '75' },
  { label: '100 miles', value: '100' },
];

export const DEFAULT_SERVICE_AREA_RADIUS = '25';

const ALLOWED_RADIUS = new Set(SERVICE_AREA_RADIUS_OPTIONS.map((option) => option.value));

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeServiceAreaRadius(value) {
  const miles = String(value ?? '').replace(/\D/g, '');
  if (ALLOWED_RADIUS.has(miles)) return miles;
  return DEFAULT_SERVICE_AREA_RADIUS;
}

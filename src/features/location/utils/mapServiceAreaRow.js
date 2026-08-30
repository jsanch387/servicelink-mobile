import { formatLocationDisplayLabel } from '../api/mapTilerGeocoding';
import {
  DEFAULT_SERVICE_AREA_RADIUS,
  normalizeServiceAreaRadius,
} from '../constants/serviceAreaRadius';

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {import('../types/location').StructuredLocation | null}
 */
export function mapServiceAreaRowToStructuredLocation(row) {
  if (!row || typeof row !== 'object') return null;

  if (row.latitude == null || row.longitude == null) return null;
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const city = String(row.city ?? '').trim();
  const state = String(row.state_code ?? row.stateCode ?? row.state ?? '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 2)
    .toUpperCase();
  const zip = String(row.postal_code ?? row.postalCode ?? row.zip ?? '')
    .replace(/\D/g, '')
    .slice(0, 5);
  const label =
    String(row.label ?? '').trim() ||
    (city && state ? formatLocationDisplayLabel(city, state, zip) : '');

  if (!city || !state || !label) return null;

  return {
    providerId: String(row.provider_place_id ?? row.providerPlaceId ?? row.id ?? ''),
    label,
    searchValue: label,
    street: '',
    city,
    state,
    zip,
    latitude,
    longitude,
    placeType: String(row.place_type ?? row.placeType ?? ''),
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {{
 *   location: import('../types/location').StructuredLocation | null;
 *   radiusMiles: number;
 *   label: string;
 * } | null}
 */
export function mapServiceAreaRow(row) {
  if (!row || typeof row !== 'object') return null;

  const location = mapServiceAreaRowToStructuredLocation(row);
  const radius = normalizeServiceAreaRadius(row.radius_miles ?? row.radiusMiles);
  const label = String(row.label ?? location?.label ?? '').trim();

  if (!location && !label) return null;

  return {
    location,
    radiusMiles: Number(radius) || Number(DEFAULT_SERVICE_AREA_RADIUS),
    label,
  };
}

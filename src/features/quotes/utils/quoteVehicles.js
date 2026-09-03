import { resolveQuoteRequestBrief } from './resolveQuoteRequestBrief';

/** Quotes take one vehicle, or a second — never more. */
export const MAX_QUOTE_VEHICLES = 2;

/**
 * @param {{ year?: unknown; make?: unknown; model?: unknown } | null | undefined} vehicle
 */
export function formatQuoteVehicleLine(vehicle) {
  return [vehicle?.year, vehicle?.make, vehicle?.model]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Splits a stored line (`2022 GMC Yukon AT4`) back into year / make / model.
 *
 * @param {string | null | undefined} label
 * @returns {{ year: string; make: string; model: string }}
 */
export function parseQuoteVehicleLine(label) {
  const parts = String(label ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { year: '', make: '', model: '' };

  let year = '';
  let rest = parts;
  if (/^\d{4}$/.test(parts[0])) {
    year = parts[0];
    rest = parts.slice(1);
  }

  return {
    year,
    make: rest[0] ?? '',
    model: rest.slice(1).join(' '),
  };
}

/**
 * @param {{ year?: unknown; make?: unknown; model?: unknown } | null | undefined} vehicle
 */
export function isQuoteVehicleFilled(vehicle) {
  return Boolean(formatQuoteVehicleLine(vehicle));
}

function assetLabel(asset) {
  const label = String(asset?.label ?? '').trim();
  if (label) return label;
  const attributes =
    asset?.attributes && typeof asset.attributes === 'object' ? asset.attributes : {};
  return formatQuoteVehicleLine({
    year: attributes.year,
    make: attributes.make,
    model: attributes.model,
  });
}

/**
 * Second vehicle from `assets`, a labels array, or a legacy `Second vehicle:` line.
 *
 * @param {{
 *   assets?: unknown;
 *   vehicles?: unknown;
 *   requestMessage?: string;
 *   primaryLine?: string;
 * }} input
 * @returns {{ year: string; make: string; model: string }}
 */
export function readPrefillSecondVehicle({
  assets,
  vehicles,
  requestMessage,
  primaryLine = '',
} = {}) {
  const assetList = (Array.isArray(assets) ? assets : [])
    .map((asset) => assetLabel(asset))
    .filter(Boolean);
  if (assetList.length > 1) {
    return parseQuoteVehicleLine(assetList[1]);
  }

  const listed = (Array.isArray(vehicles) ? vehicles : [])
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
  if (listed.length > 1) {
    return parseQuoteVehicleLine(listed[1]);
  }

  const { additionalVehicles } = resolveQuoteRequestBrief({
    message: requestMessage,
    vehicle: primaryLine || assetList[0] || listed[0] || '',
  });
  return parseQuoteVehicleLine(additionalVehicles[0] ?? '');
}

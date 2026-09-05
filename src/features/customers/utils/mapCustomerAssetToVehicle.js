/**
 * @typedef {{ id: string; label: string; year: string; make: string; model: string }} PastCustomerVehicle
 */

function cleanPart(value) {
  return String(value ?? '').trim();
}

/**
 * @param {{ year?: unknown; make?: unknown; model?: unknown } | null | undefined} vehicle
 */
export function formatPastVehicleLine(vehicle) {
  return [vehicle?.year, vehicle?.make, vehicle?.model]
    .map((part) => cleanPart(part))
    .filter(Boolean)
    .join(' ');
}

/**
 * @param {{ year?: unknown; make?: unknown; model?: unknown } | null | undefined} a
 * @param {{ year?: unknown; make?: unknown; model?: unknown } | null | undefined} b
 */
export function pastVehiclesMatch(a, b) {
  const norm = (value) => cleanPart(value).toLowerCase();
  return (
    norm(a?.year) === norm(b?.year) &&
    norm(a?.make) === norm(b?.make) &&
    norm(a?.model) === norm(b?.model) &&
    Boolean(norm(a?.year) || norm(a?.make) || norm(a?.model))
  );
}

/**
 * Splits a stored label (`2022 GMC Yukon AT4`) into year / make / model.
 *
 * @param {string | null | undefined} label
 */
export function parseVehicleLabel(label) {
  const parts = cleanPart(label).split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { year: '', make: '', model: '' };
  }

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
 * @param {Record<string, unknown> | null | undefined} asset
 * @returns {PastCustomerVehicle | null}
 */
export function mapCustomerAssetToVehicle(asset) {
  if (!asset || typeof asset !== 'object') {
    return null;
  }
  const type = cleanPart(asset.asset_type ?? asset.assetType).toLowerCase();
  if (type && type !== 'vehicle') {
    return null;
  }

  const attributes =
    asset.attributes && typeof asset.attributes === 'object' && !Array.isArray(asset.attributes)
      ? asset.attributes
      : {};
  let year = cleanPart(attributes.year);
  let make = cleanPart(attributes.make);
  let model = cleanPart(attributes.model);

  if (!year && !make && !model) {
    const parsed = parseVehicleLabel(asset.label);
    year = parsed.year;
    make = parsed.make;
    model = parsed.model;
  }

  if (!year || !make || !model) {
    return null;
  }

  const id = cleanPart(asset.id);
  const label = cleanPart(asset.label) || formatPastVehicleLine({ year, make, model });
  if (!id || !label) {
    return null;
  }

  return { id, label, year, make, model };
}

/**
 * @param {Array<Record<string, unknown>> | null | undefined} assets
 * @returns {PastCustomerVehicle[]}
 */
export function mapCustomerAssetsToPastVehicles(assets) {
  const seen = new Set();
  const out = [];
  for (const asset of assets ?? []) {
    const vehicle = mapCustomerAssetToVehicle(asset);
    if (!vehicle) {
      continue;
    }
    const key = [vehicle.year, vehicle.make, vehicle.model].map((part) => part.toLowerCase()).join('|');
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(vehicle);
  }
  return out;
}

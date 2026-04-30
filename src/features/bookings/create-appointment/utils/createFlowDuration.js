function pick(row, keys) {
  for (const key of keys) {
    if (row?.[key] != null) {
      return row[key];
    }
  }
  return null;
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Base service minutes from DB row, selected tier, or catalog UI model (`durationMinutes`).
 *
 * @param {Record<string, unknown> | null} serviceRow raw `business_services` row
 * @param {{ durationMinutes?: number } | null} selectedPricingOption
 * @param {{ durationMinutes?: number } | null} [catalogService] normalized service from `buildServicesCatalogModel`
 */
export function baseServiceDurationMinutes(serviceRow, selectedPricingOption, catalogService) {
  if (selectedPricingOption?.durationMinutes != null) {
    return Math.max(15, Number(selectedPricingOption.durationMinutes) || 60);
  }
  if (serviceRow) {
    const dm = numberOrNull(pick(serviceRow, ['duration_minutes', 'durationMinutes']));
    if (dm != null && dm > 0) return Math.max(15, dm);
    const hrs = numberOrNull(pick(serviceRow, ['hours_to_complete', 'hoursToComplete']));
    if (hrs != null && hrs > 0) return Math.max(15, Math.round(hrs * 60));
  }
  const cdm = numberOrNull(catalogService?.durationMinutes);
  if (cdm != null && cdm > 0) return Math.max(15, cdm);
  return 60;
}

/**
 * @param {number} baseMinutes
 * @param {Array<{ durationMinutes?: number | null }>} selectedAddonRows model rows from catalog (`durationLabel` ignored)
 */
export function totalBookingDurationMinutes(baseMinutes, selectedAddonRows) {
  let extra = 0;
  for (const a of selectedAddonRows ?? []) {
    const dm = numberOrNull(pick(a, ['durationMinutes', 'duration_minutes']));
    if (dm != null && dm > 0) {
      extra += dm;
    }
  }
  return Math.max(15, baseMinutes + extra);
}

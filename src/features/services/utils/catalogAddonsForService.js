function pick(row, keys) {
  for (const key of keys) {
    if (row?.[key] != null) {
      return row[key];
    }
  }
  return null;
}

/**
 * Add-ons linked to a service via `service_addon_assignments` (raw Supabase rows).
 * @param {string | null | undefined} serviceId
 * @param {Array<{ id: string; name: string; priceLabel?: string }>} catalogAddons
 * @param {Array<Record<string, unknown>>} assignmentRows
 */
export function catalogAddonsForService(serviceId, catalogAddons, assignmentRows) {
  if (!serviceId || !catalogAddons?.length) {
    return [];
  }
  const idStr = String(serviceId);
  const allowedAddonIds = new Set(
    (assignmentRows ?? [])
      .filter((row) => String(pick(row, ['service_id', 'serviceId']) ?? '') === idStr)
      .map((row) => String(pick(row, ['addon_id', 'addonId']) ?? ''))
      .filter(Boolean),
  );
  return catalogAddons.filter((a) => allowedAddonIds.has(String(a.id)));
}

/**
 * Splits stored `service_name` when it includes a pricing tier after an em dash.
 * Next Up shows {@link buildNextUpHeadlines} `servicePrimary` only (base service name).
 *
 * @param {string | null | undefined} serviceName
 * @returns {{ primary: string; detail: string | null }}
 */
export function splitServiceNameForNextUp(serviceName) {
  const raw = String(serviceName ?? '').trim() || 'Service';
  const parts = raw
    .split(/\s*—\s*/u)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { primary: parts[0], detail: parts.slice(1).join(' — ') };
  }
  return { primary: raw, detail: null };
}

/**
 * @param {Record<string, unknown> | null | undefined} booking
 * @returns {{ customerName: string; servicePrimary: string; serviceDetail: string | null }}
 */
export function buildNextUpHeadlines(booking) {
  const customerName = String(booking?.customer_name ?? '').trim() || 'Customer';
  const { primary, detail } = splitServiceNameForNextUp(booking?.service_name);
  return {
    customerName,
    servicePrimary: primary,
    serviceDetail: detail,
  };
}

/**
 * Service title for Next Up — base service name only (pricing tier omitted).
 *
 * @param {string | null | undefined} primary
 * @param {string | null | undefined} [_detail] ignored; kept for callers that still pass tier segments
 */
export function formatNextUpServiceLine(primary, _detail) {
  const p = String(primary ?? '').trim();
  return p || 'Service';
}

/**
 * Muted vehicle line (year make model only); null when empty.
 *
 * @param {string | null | undefined} vehicleLine
 * @returns {string | null}
 */
export function formatNextUpVehicleLine(vehicleLine) {
  const v = String(vehicleLine ?? '').trim();
  return v || null;
}

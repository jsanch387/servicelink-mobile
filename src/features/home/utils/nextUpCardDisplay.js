/**
 * Splits stored `service_name` (often "Base — tier" from booking flow) for scannable Next Up layout.
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
 * Service title for Next Up: primary plus tier segments (when present), e.g. `Signature Shine — SUV`.
 *
 * @param {string | null | undefined} primary
 * @param {string | null | undefined} detail tier / category from {@link splitServiceNameForNextUp}
 */
export function formatNextUpServiceLine(primary, detail) {
  const p = String(primary ?? '').trim();
  const d = String(detail ?? '').trim();
  if (d && !p) {
    return d;
  }
  const base = p || 'Service';
  if (d) {
    return `${base} — ${d}`;
  }
  return base;
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

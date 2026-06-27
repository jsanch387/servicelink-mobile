import { splitBookingServiceName } from '../../../utils/splitBookingServiceName';

/**
 * Splits stored `service_name` (often "Base — tier" from booking flow) for scannable Next Up layout.
 *
 * @param {string | null | undefined} serviceName
 * @returns {{ primary: string; detail: string | null }}
 */
export function splitServiceNameForNextUp(serviceName) {
  const { primary, pricingOption } = splitBookingServiceName(serviceName);
  return { primary, detail: pricingOption };
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
 * Service title for Next Up: base service name only (pricing tier omitted).
 *
 * @param {string | null | undefined} primary
 * @param {string | null | undefined} [_detail] ignored; kept for call-site compatibility
 */
export function formatNextUpServiceLine(primary, _detail) {
  const p = String(primary ?? '').trim();
  if (p) {
    return p;
  }
  return 'Service';
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

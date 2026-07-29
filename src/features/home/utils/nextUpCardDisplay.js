import { getBookingServiceLabelParts } from '../../bookings/utils/formatBookingServiceLabel';
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
 * @returns {{
 *   customerName: string;
 *   servicePrimary: string;
 *   serviceDetail: string | null;
 *   serviceExtraCount: number;
 * }}
 */
export function buildNextUpHeadlines(booking) {
  const customerName = String(booking?.customer_name ?? '').trim() || 'Customer';
  const parts = getBookingServiceLabelParts(booking);
  return {
    customerName,
    servicePrimary: parts.primary,
    // Pricing tier is not shown on Next Up; multi-job uses +N more on the service line.
    serviceDetail: null,
    serviceExtraCount: parts.extraCount,
  };
}

/**
 * Service title for Next Up: base name, plus `+N more` when the visit has extra jobs.
 *
 * @param {string | null | undefined} primary
 * @param {string | null | undefined} [_detail] ignored; kept for call-site compatibility
 * @param {number} [extraCount]
 */
export function formatNextUpServiceLine(primary, _detail, extraCount = 0) {
  const p = String(primary ?? '').trim();
  const label = p || 'Service';
  const extra = Math.max(0, Math.round(Number(extraCount) || 0));
  if (extra > 0) {
    return `${label} +${extra} more`;
  }
  return label;
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

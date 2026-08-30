import { dbModeOffersShop, normalizeDbServiceLocationMode } from './bookingLinkBookingSettings';

/**
 * Shop / Both profiles saved before shop city/state had their own columns.
 * Mobile-only is handled by the service-area prompt.
 *
 * @param {{
 *   service_location_mode?: string | null,
 *   shop_city?: string | null,
 *   shop_state?: string | null,
 * } | null | undefined} row
 * @returns {boolean}
 */
export function needsLegacyShopAddressUpdate(row) {
  const mode = normalizeDbServiceLocationMode(row?.service_location_mode);
  if (!dbModeOffersShop(mode)) return false;

  const city = String(row?.shop_city ?? '').trim();
  const state = String(row?.shop_state ?? '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 2)
    .toUpperCase();

  return !city || !state;
}

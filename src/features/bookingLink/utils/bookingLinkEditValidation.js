import {
  BOOKING_SERVICE_TYPE_BOTH,
  BOOKING_SERVICE_TYPE_SHOP,
} from '../edit/constants/bookingLinkBookingTab';
import { buildServiceArea, normalizeBusinessZip } from './serviceArea';
import { uiServiceTypeToDbMode } from './bookingLinkBookingSettings';

const SERVICE_AREA_PATTERN = /^.+,\s*[A-Z]{2}$/;

/**
 * @param {{
 *   cityInput?: string,
 *   stateInput?: string,
 *   zipInput?: string,
 *   serviceTypeInput?: string,
 *   shopStreetInput?: string,
 * }} fields
 * @returns {{ ok: true } | { ok: false, title: string, message: string }}
 */
export function validateBookingLinkEditFields(fields) {
  const city = String(fields.cityInput ?? '').trim();
  const state = String(fields.stateInput ?? '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 2)
    .toUpperCase();
  const zip = normalizeBusinessZip(fields.zipInput);
  const serviceType = fields.serviceTypeInput;
  const shopStreet = String(fields.shopStreetInput ?? '').trim();
  const mode = uiServiceTypeToDbMode(serviceType);
  const offersShop = mode === 'shop_only' || mode === 'both';

  if (!city || !state) {
    return { ok: false, title: 'Location', message: 'City and state are required.' };
  }

  const serviceArea = buildServiceArea(city, state);
  if (!serviceArea || !SERVICE_AREA_PATTERN.test(serviceArea)) {
    return { ok: false, title: 'Location', message: 'City and state are required.' };
  }

  if (!zip || zip.length !== 5) {
    return { ok: false, title: 'Location', message: 'ZIP is required.' };
  }

  if (offersShop) {
    if (!shopStreet) {
      return { ok: false, title: 'Shop address', message: 'Shop street address is required.' };
    }
    if (!city || !state || !zip) {
      return {
        ok: false,
        title: 'Shop address',
        message: 'Shop address requires city, state, and ZIP.',
      };
    }
  }

  return { ok: true };
}

export function bookingServiceTypeOffersShop(uiServiceType) {
  return uiServiceType === BOOKING_SERVICE_TYPE_SHOP || uiServiceType === BOOKING_SERVICE_TYPE_BOTH;
}

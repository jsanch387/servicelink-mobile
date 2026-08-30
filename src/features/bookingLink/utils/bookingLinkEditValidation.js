import {
  getSpecialtiesForBusinessType,
  sanitizeBusinessSpecialties,
  SPECIALTIES_REQUIRED_ERROR,
} from '../../../constants/businessSpecialties';
import { isAllowedBusinessTypeValue } from '../../../constants/businessTypes';
import {
  BOOKING_SERVICE_TYPE_BOTH,
  BOOKING_SERVICE_TYPE_SHOP,
} from '../edit/constants/bookingLinkBookingTab';
import { buildServiceArea, normalizeBusinessZip } from './serviceArea';
import { uiServiceTypeToDbMode } from './bookingLinkBookingSettings';

const SERVICE_AREA_PATTERN = /^.+,\s*[A-Z]{2}$/;

export const BOOKING_POLICY_REQUIRED_ERROR = 'Add your customer policy or turn it off.';

/**
 * @param {{
 *   cityInput?: string,
 *   stateInput?: string,
 *   zipInput?: string,
 *   serviceTypeInput?: string,
 *   shopStreetInput?: string,
 *   shopCityInput?: string,
 *   shopStateInput?: string,
 *   shopZipInput?: string,
 *   shopRequiresSuggestion?: boolean,
 *   typeInput?: string,
 *   specialtiesInput?: string[],
 *   locationRequiresSuggestion?: boolean,
 *   policyEnabled?: boolean,
 *   policyInput?: string,
 * }} fields
 * @returns {{ ok: true } | { ok: false, title: string, message: string }}
 */
export function validateBookingLinkEditFields(fields) {
  if (fields.locationRequiresSuggestion) {
    return {
      ok: false,
      title: 'Location',
      message: 'Choose a suggested location to confirm it',
    };
  }

  const city = String(fields.cityInput ?? '').trim();
  const state = String(fields.stateInput ?? '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 2)
    .toUpperCase();
  const zip = normalizeBusinessZip(fields.zipInput);
  const serviceType = fields.serviceTypeInput;
  const shopStreet = String(fields.shopStreetInput ?? '').trim();
  const shopCity = String(fields.shopCityInput ?? '').trim();
  const shopState = String(fields.shopStateInput ?? '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 2)
    .toUpperCase();
  const shopZip = normalizeBusinessZip(fields.shopZipInput);
  const mode = uiServiceTypeToDbMode(serviceType);
  const offersShop = mode === 'shop_only' || mode === 'both';

  if (!city || !state) {
    return { ok: false, title: 'Location', message: 'City and state are required.' };
  }

  const serviceArea = buildServiceArea(city, state);
  if (!serviceArea || !SERVICE_AREA_PATTERN.test(serviceArea)) {
    return { ok: false, title: 'Location', message: 'City and state are required.' };
  }

  if (zip && zip.length !== 5) {
    return { ok: false, title: 'Location', message: 'ZIP must be 5 digits.' };
  }

  if (offersShop) {
    if (fields.shopRequiresSuggestion) {
      return {
        ok: false,
        title: 'Shop address',
        message: 'Choose a suggested shop address.',
      };
    }
    if (!shopStreet) {
      return { ok: false, title: 'Shop address', message: 'Shop street address is required.' };
    }
    if (!shopCity || !shopState) {
      return {
        ok: false,
        title: 'Shop address',
        message: 'Pick a street address so we can save the shop city and state.',
      };
    }
    if (shopZip && shopZip.length !== 5) {
      return { ok: false, title: 'Shop address', message: 'Shop ZIP must be 5 digits.' };
    }
  }

  if (fields.policyEnabled && !String(fields.policyInput ?? '').trim()) {
    return {
      ok: false,
      title: 'Customer policy',
      message: BOOKING_POLICY_REQUIRED_ERROR,
    };
  }

  const type = String(fields.typeInput ?? '').trim();
  if (type && !isAllowedBusinessTypeValue(type)) {
    return { ok: false, title: 'Business type', message: 'Choose a business type from the list.' };
  }
  if (
    type &&
    getSpecialtiesForBusinessType(type).length > 0 &&
    sanitizeBusinessSpecialties(fields.specialtiesInput).length === 0
  ) {
    return {
      ok: false,
      title: 'Business type',
      message: SPECIALTIES_REQUIRED_ERROR,
    };
  }

  return { ok: true };
}

export function bookingServiceTypeOffersShop(uiServiceType) {
  return uiServiceType === BOOKING_SERVICE_TYPE_SHOP || uiServiceType === BOOKING_SERVICE_TYPE_BOTH;
}

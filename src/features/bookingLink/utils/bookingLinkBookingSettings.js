import {
  BOOKING_DEFAULT_LANGUAGE_EN,
  BOOKING_DEFAULT_LANGUAGE_ES,
  BOOKING_SERVICE_TYPE_BOTH,
  BOOKING_SERVICE_TYPE_MOBILE,
  BOOKING_SERVICE_TYPE_SHOP,
} from '../edit/constants/bookingLinkBookingTab';
import { normalizeBusinessZip, parseServiceAreaCityState } from './serviceArea';

export const DB_SERVICE_LOCATION_MOBILE = 'mobile_only';
export const DB_SERVICE_LOCATION_SHOP = 'shop_only';
export const DB_SERVICE_LOCATION_BOTH = 'both';

const VALID_DB_MODES = new Set([
  DB_SERVICE_LOCATION_MOBILE,
  DB_SERVICE_LOCATION_SHOP,
  DB_SERVICE_LOCATION_BOTH,
]);

/** @param {string | null | undefined} uiType */
export function uiServiceTypeToDbMode(uiType) {
  switch (uiType) {
    case BOOKING_SERVICE_TYPE_SHOP:
      return DB_SERVICE_LOCATION_SHOP;
    case BOOKING_SERVICE_TYPE_BOTH:
      return DB_SERVICE_LOCATION_BOTH;
    case BOOKING_SERVICE_TYPE_MOBILE:
    default:
      return DB_SERVICE_LOCATION_MOBILE;
  }
}

/** @param {string | null | undefined} mode */
export function dbModeToUiServiceType(mode) {
  switch (mode) {
    case DB_SERVICE_LOCATION_SHOP:
      return BOOKING_SERVICE_TYPE_SHOP;
    case DB_SERVICE_LOCATION_BOTH:
      return BOOKING_SERVICE_TYPE_BOTH;
    case DB_SERVICE_LOCATION_MOBILE:
    default:
      return BOOKING_SERVICE_TYPE_MOBILE;
  }
}

/** @param {string | null | undefined} mode */
export function normalizeDbServiceLocationMode(mode) {
  return VALID_DB_MODES.has(mode) ? mode : DB_SERVICE_LOCATION_MOBILE;
}

/** @param {string[] | null | undefined} raw */
export function normalizePublicBookingLocales(raw) {
  const arr = Array.isArray(raw) ? raw.filter((l) => l === 'en' || l === 'es') : [];
  const ordered = [];
  if (arr.includes('en') || arr.length === 0) {
    ordered.push('en');
  }
  if (arr.includes('es')) {
    ordered.push('es');
  }
  return ordered;
}

/** Stable key for dirty detection. */
export function publicBookingLocalesKey(locales) {
  return normalizePublicBookingLocales(locales).join('\u0001');
}

/**
 * @param {{
 *   service_location_mode?: string | null,
 *   service_area?: string | null,
 *   business_zip?: string | null,
 *   shop_street_address?: string | null,
 *   shop_unit?: string | null,
 * }} row
 */
export function serviceLocationFromProfile(row) {
  const { city, state } = parseServiceAreaCityState(row?.service_area);
  return {
    mode: dbModeToUiServiceType(normalizeDbServiceLocationMode(row?.service_location_mode)),
    shopStreetAddress: String(row?.shop_street_address ?? '').trim(),
    shopUnit: String(row?.shop_unit ?? '').trim(),
    city,
    state,
    zip: normalizeBusinessZip(row?.business_zip),
  };
}

/**
 * @param {{
 *   public_booking_locales?: string[] | null,
 *   public_booking_default_locale?: string | null,
 * }} row
 */
export function languagesFromProfile(row) {
  const locales = normalizePublicBookingLocales(row?.public_booking_locales);
  const offerSpanish = locales.includes('es');
  let defaultLocale =
    row?.public_booking_default_locale === BOOKING_DEFAULT_LANGUAGE_ES
      ? BOOKING_DEFAULT_LANGUAGE_ES
      : BOOKING_DEFAULT_LANGUAGE_EN;
  if (!offerSpanish) {
    defaultLocale = BOOKING_DEFAULT_LANGUAGE_EN;
  }
  if (!locales.includes(defaultLocale)) {
    defaultLocale = BOOKING_DEFAULT_LANGUAGE_EN;
  }
  return { offerSpanish, defaultLocale, locales };
}

/**
 * @param {string} uiServiceType
 * @param {string} shopStreet
 * @param {string} shopUnit
 */
export function serviceLocationToDb(uiServiceType, shopStreet, shopUnit) {
  const mode = uiServiceTypeToDbMode(uiServiceType);
  const offersShop = mode === DB_SERVICE_LOCATION_SHOP || mode === DB_SERVICE_LOCATION_BOTH;
  const street = String(shopStreet ?? '').trim();
  const unit = String(shopUnit ?? '').trim();
  return {
    service_location_mode: mode,
    shop_street_address: offersShop ? street || null : null,
    shop_unit: offersShop && unit ? unit : null,
  };
}

/**
 * @param {boolean} offerSpanish
 * @param {'en' | 'es'} defaultLocale
 */
export function languagesToDb(offerSpanish, defaultLocale) {
  const public_booking_locales = offerSpanish ? ['en', 'es'] : ['en'];
  let public_booking_default_locale = offerSpanish ? defaultLocale : BOOKING_DEFAULT_LANGUAGE_EN;
  if (!public_booking_locales.includes(public_booking_default_locale)) {
    public_booking_default_locale = BOOKING_DEFAULT_LANGUAGE_EN;
  }
  return { public_booking_locales, public_booking_default_locale };
}

export function dbModeOffersShop(mode) {
  return mode === DB_SERVICE_LOCATION_SHOP || mode === DB_SERVICE_LOCATION_BOTH;
}

import {
  resolveBusinessSpecialties,
  specialtiesFingerprint,
} from '../../../constants/businessSpecialties';
import { canonicalizeBusinessType } from '../../../constants/businessTypes';
import { canonicalNanpDigits } from '../../../utils/phone';
import {
  languagesToDb,
  normalizeDbServiceLocationMode,
  publicBookingLocalesKey,
  serviceLocationToDb,
  uiServiceTypeToDbMode,
} from './bookingLinkBookingSettings';
import { socialMediaFingerprint, socialMediaToDb } from './socialMedia';
import { normalizeBookingPolicyText } from '../edit/constants/bookingLinkCustomerPolicy';

/**
 * @typedef {object} BookingLinkEditSnapshot
 * @property {string} businessName
 * @property {string} businessType
 * @property {string} specialtiesKey
 * @property {string} city
 * @property {string} state Two-letter uppercase or ''
 * @property {string} zip Five-digit ZIP or ''
 * @property {string} bio
 * @property {string} phoneComparableDigits Canonical 10-digit NANP for equality (display vs DB).
 * @property {string} socialMediaKey
 * @property {string} serviceLocationMode DB mode: mobile_only | shop_only | both
 * @property {string} shopStreetAddress
 * @property {string} shopUnit
 * @property {string} shopCity
 * @property {string} shopState
 * @property {string} shopZip
 * @property {string} publicBookingLocalesKey
 * @property {string} publicBookingDefaultLocale en | es
 * @property {boolean} bookingPolicyEnabled
 * @property {string} bookingPolicyText
 */

function normalizeZipSlice(raw) {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .slice(0, 5);
}

function normalizeStateSlice(raw) {
  return String(raw ?? '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 2)
    .toUpperCase();
}

/** Stable phone compare for dirty detection (formatted UI vs E.164 DB). */
export function phoneDigitsFingerprint(value) {
  return canonicalNanpDigits(value);
}

/**
 * Snapshot loaded profile props into a comparable shape (same as draft keys).
 * @param {{
 *   businessName?: string,
 *   businessType?: string,
 *   specialties?: string[] | null,
 *   businessCity?: string,
 *   businessState?: string,
 *   businessZip?: string,
 *   businessBio?: string,
 *   phoneNumber?: string,
 *   socialMedia?: { instagram?: string; tiktok?: string },
 *   serviceLocationMode?: string,
 *   shopStreetAddress?: string,
 *   shopUnit?: string,
 *   shopCity?: string,
 *   shopState?: string,
 *   shopZip?: string,
 *   publicBookingLocales?: string[],
 *   publicBookingDefaultLocale?: string,
 *   bookingPolicyEnabled?: boolean,
 *   bookingPolicyText?: string,
 * }} props
 * @returns {BookingLinkEditSnapshot}
 */
export function bookingLinkEditBaselineFromProps(props) {
  return {
    businessName: String(props.businessName ?? '').trim(),
    businessType: String(props.businessType ?? '').trim(),
    specialtiesKey: specialtiesFingerprint(
      resolveBusinessSpecialties(props.businessType, props.specialties),
    ),
    city: String(props.businessCity ?? '').trim(),
    state: normalizeStateSlice(props.businessState),
    zip: normalizeZipSlice(props.businessZip),
    bio: String(props.businessBio ?? '').trim(),
    phoneComparableDigits: phoneDigitsFingerprint(props.phoneNumber ?? ''),
    socialMediaKey: socialMediaFingerprint(props.socialMedia),
    serviceLocationMode: normalizeDbServiceLocationMode(props.serviceLocationMode),
    shopStreetAddress: String(props.shopStreetAddress ?? '').trim(),
    shopUnit: String(props.shopUnit ?? '').trim(),
    shopCity: String(props.shopCity ?? '').trim(),
    shopState: normalizeStateSlice(props.shopState),
    shopZip: normalizeZipSlice(props.shopZip),
    publicBookingLocalesKey: publicBookingLocalesKey(props.publicBookingLocales),
    publicBookingDefaultLocale: props.publicBookingDefaultLocale === 'es' ? 'es' : 'en',
    bookingPolicyEnabled: Boolean(props.bookingPolicyEnabled),
    bookingPolicyText: normalizeBookingPolicyText(props.bookingPolicyText).trim(),
  };
}

/**
 * Map edit-mode controlled fields to the same snapshot shape as {@link bookingLinkEditBaselineFromProps}.
 */
export function bookingLinkEditDraftFromFields(fields) {
  const offerSpanish = Boolean(fields.spanishEnabled);
  const defaultLocale = fields.defaultLanguageInput === 'es' ? 'es' : 'en';
  const { public_booking_locales, public_booking_default_locale } = languagesToDb(
    offerSpanish,
    defaultLocale,
  );

  return {
    businessName: String(fields.nameInput ?? '').trim(),
    businessType: String(fields.typeInput ?? '').trim(),
    specialtiesKey: specialtiesFingerprint(fields.specialtiesInput),
    city: String(fields.cityInput ?? '').trim(),
    state: normalizeStateSlice(fields.stateInput),
    zip: normalizeZipSlice(fields.zipInput),
    bio: String(fields.bioInput ?? '').trim(),
    phoneComparableDigits: phoneDigitsFingerprint(fields.phoneInput ?? ''),
    socialMediaKey: socialMediaFingerprint({
      instagram: fields.instagramInput,
      tiktok: fields.tiktokInput,
    }),
    serviceLocationMode: uiServiceTypeToDbMode(fields.serviceTypeInput),
    shopStreetAddress: String(fields.shopStreetInput ?? '').trim(),
    shopUnit: String(fields.shopUnitInput ?? '').trim(),
    shopCity: String(fields.shopCityInput ?? '').trim(),
    shopState: normalizeStateSlice(fields.shopStateInput),
    shopZip: normalizeZipSlice(fields.shopZipInput),
    publicBookingLocalesKey: publicBookingLocalesKey(public_booking_locales),
    publicBookingDefaultLocale: public_booking_default_locale,
    bookingPolicyEnabled: Boolean(fields.policyEnabled),
    bookingPolicyText: normalizeBookingPolicyText(fields.policyInput).trim(),
  };
}

/**
 * @param {BookingLinkEditSnapshot} a
 * @param {BookingLinkEditSnapshot} b
 */
export function bookingLinkEditSnapshotsEqual(a, b) {
  return (
    a.businessName === b.businessName &&
    a.businessType === b.businessType &&
    a.specialtiesKey === b.specialtiesKey &&
    a.city === b.city &&
    a.state === b.state &&
    a.zip === b.zip &&
    a.bio === b.bio &&
    a.phoneComparableDigits === b.phoneComparableDigits &&
    a.socialMediaKey === b.socialMediaKey &&
    a.serviceLocationMode === b.serviceLocationMode &&
    a.shopStreetAddress === b.shopStreetAddress &&
    a.shopUnit === b.shopUnit &&
    a.shopCity === b.shopCity &&
    a.shopState === b.shopState &&
    a.shopZip === b.shopZip &&
    a.publicBookingLocalesKey === b.publicBookingLocalesKey &&
    a.publicBookingDefaultLocale === b.publicBookingDefaultLocale &&
    a.bookingPolicyEnabled === b.bookingPolicyEnabled &&
    a.bookingPolicyText === b.bookingPolicyText
  );
}

/** True when any persisted edit field differs from baseline (images ignored). */
export function bookingLinkEditIsDirty(baseline, draft) {
  return !bookingLinkEditSnapshotsEqual(baseline, draft);
}

/** Convenience: compare server-style props to current edit fields (single call from screens). */
export function bookingLinkEditDirtyVsProps(baselineProps, editFields) {
  return bookingLinkEditIsDirty(
    bookingLinkEditBaselineFromProps(baselineProps),
    bookingLinkEditDraftFromFields(editFields),
  );
}

/** @deprecated Use {@link bookingLinkEditBaselineFromProps} */
export const bookingLinkTextBaselineFromProps = bookingLinkEditBaselineFromProps;

/** @deprecated Use {@link bookingLinkEditDraftFromFields} */
export function bookingLinkTextDraftFromEditFields(fields) {
  return bookingLinkEditDraftFromFields(fields);
}

/** @deprecated Use {@link bookingLinkEditSnapshotsEqual} */
export const bookingLinkTextSnapshotsEqual = bookingLinkEditSnapshotsEqual;

/** @deprecated Use {@link bookingLinkEditIsDirty} */
export const bookingLinkTextIsDirty = bookingLinkEditIsDirty;

/** @deprecated Use {@link bookingLinkEditDirtyVsProps} */
export const bookingLinkTextDirtyVsProps = bookingLinkEditDirtyVsProps;

/**
 * Payload expected by {@link saveOwnerBookingLink}.
 */
export function buildSaveBookingLinkTextVariables(args) {
  const {
    userId,
    businessId,
    nameInput,
    typeInput,
    specialtiesInput,
    cityInput,
    stateInput,
    zipInput,
    bioInput,
    phoneInput,
    serviceTypeInput,
    shopStreetInput,
    shopUnitInput,
    shopCityInput,
    shopStateInput,
    shopZipInput,
    spanishEnabled,
    defaultLanguageInput,
    logoImageUri,
    coverImageUri,
    previousLogoPath,
    previousBannerPath,
    gallery,
    instagramInput,
    tiktokInput,
    policyEnabled,
    policyInput,
  } = args;

  const { public_booking_locales, public_booking_default_locale } = languagesToDb(
    Boolean(spanishEnabled),
    defaultLanguageInput === 'es' ? 'es' : 'en',
  );

  const serviceLocationDb = serviceLocationToDb(
    serviceTypeInput,
    shopStreetInput,
    shopUnitInput,
    shopCityInput,
    shopStateInput,
    shopZipInput,
  );
  const social_media = socialMediaToDb({
    instagram: instagramInput,
    tiktok: tiktokInput,
  });

  return {
    userId,
    businessId,
    businessName: nameInput,
    businessType: canonicalizeBusinessType(typeInput) ?? String(typeInput ?? '').trim(),
    specialties: specialtiesInput,
    city: cityInput,
    state: stateInput,
    zip: zipInput,
    bio: bioInput,
    phoneInput,
    social_media,
    service_location_mode: serviceLocationDb.service_location_mode,
    shop_street_address: serviceLocationDb.shop_street_address,
    shop_unit: serviceLocationDb.shop_unit,
    shop_city: serviceLocationDb.shop_city,
    shop_state: serviceLocationDb.shop_state,
    shop_zip: serviceLocationDb.shop_zip,
    public_booking_locales,
    public_booking_default_locale,
    booking_policy_enabled:
      Boolean(policyEnabled) && Boolean(normalizeBookingPolicyText(policyInput).trim()),
    booking_policy_text: normalizeBookingPolicyText(policyInput).trim() || null,
    logoImageUri: logoImageUri ?? null,
    coverImageUri: coverImageUri ?? null,
    previousLogoPath: previousLogoPath ?? null,
    previousBannerPath: previousBannerPath ?? null,
    ...(gallery ? { gallery } : {}),
  };
}

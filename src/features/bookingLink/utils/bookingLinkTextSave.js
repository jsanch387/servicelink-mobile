import { canonicalNanpDigits } from '../../../utils/phone';

/**
 * @typedef {object} BookingLinkTextSnapshot
 * @property {string} businessName
 * @property {string} businessType
 * @property {string} city
 * @property {string} state Two-letter uppercase or ''
 * @property {string} bio
 * @property {string} phoneComparableDigits Canonical 10-digit NANP for equality (display vs DB).
 */

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
 *   businessCity?: string,
 *   businessState?: string,
 *   businessBio?: string,
 *   phoneNumber?: string,
 * }} props
 * @returns {BookingLinkTextSnapshot}
 */
export function bookingLinkTextBaselineFromProps(props) {
  return {
    businessName: String(props.businessName ?? '').trim(),
    businessType: String(props.businessType ?? '').trim(),
    city: String(props.businessCity ?? '').trim(),
    state: normalizeStateSlice(props.businessState),
    bio: String(props.businessBio ?? '').trim(),
    phoneComparableDigits: phoneDigitsFingerprint(props.phoneNumber ?? ''),
  };
}

/**
 * Map edit-mode controlled fields to the same snapshot shape as {@link bookingLinkTextBaselineFromProps}.
 */
export function bookingLinkTextDraftFromEditFields(fields) {
  return {
    businessName: String(fields.nameInput ?? '').trim(),
    businessType: String(fields.typeInput ?? '').trim(),
    city: String(fields.cityInput ?? '').trim(),
    state: normalizeStateSlice(fields.stateInput),
    bio: String(fields.bioInput ?? '').trim(),
    phoneComparableDigits: phoneDigitsFingerprint(fields.phoneInput ?? ''),
  };
}

/**
 * @param {BookingLinkTextSnapshot} a
 * @param {BookingLinkTextSnapshot} b
 */
export function bookingLinkTextSnapshotsEqual(a, b) {
  return (
    a.businessName === b.businessName &&
    a.businessType === b.businessType &&
    a.city === b.city &&
    a.state === b.state &&
    a.bio === b.bio &&
    a.phoneComparableDigits === b.phoneComparableDigits
  );
}

/**
 * True when any persisted text field differs from baseline (images ignored).
 */
export function bookingLinkTextIsDirty(baseline, draft) {
  return !bookingLinkTextSnapshotsEqual(baseline, draft);
}

/**
 * Convenience: compare server-style props to current edit fields (single call from screens).
 */
export function bookingLinkTextDirtyVsProps(baselineProps, editFields) {
  return bookingLinkTextIsDirty(
    bookingLinkTextBaselineFromProps(baselineProps),
    bookingLinkTextDraftFromEditFields(editFields),
  );
}

/**
 * Payload expected by {@link saveOwnerBookingLink}.
 * @param {{
 *   userId: string,
 *   businessId: string,
 *   nameInput: string,
 *   typeInput: string,
 *   cityInput: string,
 *   stateInput: string,
 *   bioInput: string,
 *   phoneInput: string,
 *   logoImageUri?: string | null,
 *   coverImageUri?: string | null,
 *   previousLogoPath?: string | null,
 *   previousBannerPath?: string | null,
 *   gallery?: { existingOrderedStoragePaths: string[], newLocalUrisOrdered: string[] },
 * }} args
 */
export function buildSaveBookingLinkTextVariables(args) {
  const {
    userId,
    businessId,
    nameInput,
    typeInput,
    cityInput,
    stateInput,
    bioInput,
    phoneInput,
    logoImageUri,
    coverImageUri,
    previousLogoPath,
    previousBannerPath,
    gallery,
  } = args;
  return {
    userId,
    businessId,
    businessName: nameInput,
    businessType: typeInput,
    city: cityInput,
    state: stateInput,
    bio: bioInput,
    phoneInput,
    logoImageUri: logoImageUri ?? null,
    coverImageUri: coverImageUri ?? null,
    previousLogoPath: previousLogoPath ?? null,
    previousBannerPath: previousBannerPath ?? null,
    ...(gallery ? { gallery } : {}),
  };
}

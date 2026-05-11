/**
 * Max lengths for onboarding text fields (anti-spam / DB-friendly caps).
 * Keep in sync with UI `maxLength` and `onboardingV2Api` checks.
 */

/** `business_profiles.business_name` — enough for real names, bounded for abuse. */
export const MAX_ONBOARDING_BUSINESS_NAME_LENGTH = 120;

/** `business_services.name` — short customer-facing label. */
export const MAX_ONBOARDING_SERVICE_NAME_LENGTH = 120;

/** `business_services.description` — matches onboarding multiline field. */
export const MAX_ONBOARDING_SERVICE_DESCRIPTION_LENGTH = 800;

/**
 * Typed price before `$` prefix: digits + optional decimal (e.g. `999999.99`).
 * Caps absurdly long pastes while allowing normal dollar amounts.
 */
export const MAX_ONBOARDING_SERVICE_PRICE_INPUT_LENGTH = 12;

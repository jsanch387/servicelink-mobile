import { Platform } from 'react-native';

/** System sans used on service cards (Services screen + Booking link services tab). */
export const SERVICE_CARD_TITLE_SYSTEM_FONT = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'sans-serif',
});

/** Service card title line size (px) — Services list + Booking link services tab. */
export const SERVICE_CARD_TITLE_FONT_SIZE = 17;

/** Booking link preview header business name only (larger than service cards). */
export const BOOKING_LINK_PROFILE_BUSINESS_NAME_FONT_SIZE = 25;

/**
 * Title row on service cards: black/heavy system sans.
 * @param {{ text: string }} colors Theme token object (`colors.text`).
 */
export function serviceCardTitleStyle(colors) {
  return {
    color: colors.text,
    fontFamily: SERVICE_CARD_TITLE_SYSTEM_FONT,
    fontSize: SERVICE_CARD_TITLE_FONT_SIZE,
    fontWeight: '900',
  };
}

/** Same weight/font family as service cards, larger size for profile hero name. */
export function bookingLinkProfileBusinessNameStyle(colors) {
  return {
    ...serviceCardTitleStyle(colors),
    fontSize: BOOKING_LINK_PROFILE_BUSINESS_NAME_FONT_SIZE,
  };
}

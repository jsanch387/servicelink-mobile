import { canonicalNanpDigits, isValidUsNanpTenDigits } from '../../../../utils/phone';

/** @param {string | null | undefined} phoneNumber */
export function hasValidBookingLinkContactPhone(phoneNumber) {
  const d = canonicalNanpDigits(phoneNumber);
  return d.length === 10 && isValidUsNanpTenDigits(d);
}

/**
 * Public booking-link header CTAs (owner preview mirrors customer page).
 *
 * @param {{ phoneNumber?: string | null, showRequestQuoteCta?: boolean }} input
 */
export function resolveBookingProfileCtaVisibility({ phoneNumber, showRequestQuoteCta }) {
  const showContact = hasValidBookingLinkContactPhone(phoneNumber);
  const showRequestQuote = showRequestQuoteCta === true;
  return {
    showContact,
    showRequestQuote,
    showCtaRow: showContact || showRequestQuote,
  };
}

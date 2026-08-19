import { phoneForSmsUri } from '../../../utils/phone';

/**
 * @typedef {object} BookingForReviewEligibility
 * @property {string} id
 * @property {string | null} [customer_id]
 * @property {string | null} [customer_email]
 */

/**
 * @typedef {object} ReviewEligibilityContext
 * @property {Set<string>} reviewedCustomerIds
 * @property {Set<string>} pendingInviteCustomerIds
 * @property {Set<string>} bookingIdsWithInvite
 */

/**
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
export function normalizedCustomerEmail(raw) {
  const s = (raw ?? '').trim();
  return s && isValidEmail(s) ? s : null;
}

/**
 * Same logic as web `willSendReviewInviteOnComplete`.
 *
 * @param {BookingForReviewEligibility} booking
 * @param {ReviewEligibilityContext} ctx
 * @returns {boolean}
 */
export function willSendReviewInviteOnComplete(booking, ctx) {
  const bookingId = booking.id?.trim();
  if (!bookingId) {
    return false;
  }
  if (!normalizedCustomerEmail(booking.customer_email)) {
    return false;
  }

  const customerId = booking.customer_id?.trim() ?? '';
  if (!customerId) {
    return false;
  }

  if (ctx.bookingIdsWithInvite.has(bookingId)) {
    return false;
  }
  if (ctx.reviewedCustomerIds.has(customerId)) {
    return false;
  }
  if (ctx.pendingInviteCustomerIds.has(customerId)) {
    return false;
  }

  return true;
}

/**
 * For confirm-modal copy only (web parity).
 *
 * @param {Pick<BookingForReviewEligibility, 'customer_id'>} booking
 * @param {ReviewEligibilityContext} ctx
 * @returns {boolean}
 */
export function customerAlreadyReviewed(booking, ctx) {
  const customerId = booking.customer_id?.trim() ?? '';
  return Boolean(customerId && ctx.reviewedCustomerIds.has(customerId));
}

/**
 * @param {BookingForReviewEligibility} booking
 * @param {ReviewEligibilityContext} ctx
 * @returns {{ showReviewInviteMessage: boolean }}
 */
export function getMarkCompleteModalCopy(booking, ctx) {
  const hasEmail = Boolean(booking.customer_email?.trim());
  const alreadyReviewed = customerAlreadyReviewed(booking, ctx);
  return { showReviewInviteMessage: hasEmail && !alreadyReviewed };
}

/**
 * Client preview for complete-visit customer notifications (SMS → email fallback).
 * Receipt is sent when a channel exists; review link only when the customer is eligible.
 *
 * `canUseSms` must reflect this owner's runtime SMS access
 * (`useCustomerSmsAccess().canUseSms`). Without it the customer's phone is
 * ignored, matching the server: owners who can't text fall through to the
 * invoice email, so promising a text would be wrong. It defaults to off so a
 * caller that forgets to pass it understates rather than over-promises.
 *
 * `smsOptIn` is `customers.sms_opt_in`. Explicit `false` means opted out — do not
 * promise SMS (fall through to email). `true` / `null` / omitted allow SMS when
 * phone + owner SMS access are present.
 *
 * @param {BookingForReviewEligibility & { customer_phone?: string | null }} booking
 * @param {ReviewEligibilityContext | null | undefined} ctx
 * @param {{ canUseSms?: boolean; smsOptIn?: boolean | null }} [options]
 * @returns {import('../../bookings/booking-details/utils/markCompletePreview').MarkCompletePreview}
 */
export function getCompleteVisitNotificationPreview(
  booking,
  ctx,
  { canUseSms = false, smsOptIn = null } = {},
) {
  const customerAllowsSms = smsOptIn !== false;
  const hasPhone =
    canUseSms && customerAllowsSms && Boolean(phoneForSmsUri(booking?.customer_phone));
  const hasEmail = Boolean(normalizedCustomerEmail(booking?.customer_email));
  const alreadyReviewed = ctx ? customerAlreadyReviewed(booking, ctx) : false;

  if (hasPhone) {
    return {
      showReviewSmsMessage: true,
      showReviewInviteMessage: false,
      showNoReviewInviteMessage: false,
      showSmsOptOutMessage: false,
      showReviewInvite: !alreadyReviewed,
    };
  }

  if (hasEmail) {
    const showReviewInvite =
      ctx != null ? willSendReviewInviteOnComplete(booking, ctx) : !alreadyReviewed;
    return {
      showReviewSmsMessage: false,
      showReviewInviteMessage: true,
      showNoReviewInviteMessage: false,
      showSmsOptOutMessage: false,
      showReviewInvite,
    };
  }

  const optedOutWithPhone =
    canUseSms && smsOptIn === false && Boolean(phoneForSmsUri(booking?.customer_phone));

  return {
    showReviewSmsMessage: false,
    showReviewInviteMessage: false,
    showNoReviewInviteMessage: !optedOutWithPhone,
    showSmsOptOutMessage: optedOutWithPhone,
    showReviewInvite: false,
  };
}

import { normalizedCustomerEmail } from '../../../reviews/utils/reviewInviteEligibility';
import { phoneForSmsUri } from '../../../../utils/phone';

/**
 * @typedef {object} MarkCompletePreview
 * @property {boolean} showReviewSmsMessage SMS review link (primary).
 * @property {boolean} showReviewInviteMessage Email review link when SMS is not available.
 * @property {boolean} showNoReviewInviteMessage No contact on file — owner should know invite won't go out.
 * @property {boolean} showSmsOptOutMessage Phone on file but customer opted out of texts (and no email fallback).
 * @property {boolean} [showReviewInvite] When false, customer gets receipt/thank-you only (already reviewed).
 */

/**
 * Preview for the mark-complete confirm sheet (client-side; mirrors server SMS → email fallback).
 *
 * `canUseSms` must reflect this owner's runtime SMS access; see
 * {@link import('../../../reviews/utils/reviewInviteEligibility').getCompleteVisitNotificationPreview}.
 *
 * @param {{
 *   customer_phone?: string | null;
 *   customer_email?: string | null;
 * } | null | undefined} booking
 * @param {{ canUseSms?: boolean; smsOptIn?: boolean | null }} [options]
 * @returns {MarkCompletePreview}
 */
export function getMarkCompletePreviewFromBooking(
  booking,
  { canUseSms = false, smsOptIn = null } = {},
) {
  const customerAllowsSms = smsOptIn !== false;
  const hasPhone =
    canUseSms && customerAllowsSms && Boolean(phoneForSmsUri(booking?.customer_phone));
  if (hasPhone) {
    return {
      showReviewSmsMessage: true,
      showReviewInviteMessage: false,
      showNoReviewInviteMessage: false,
      showSmsOptOutMessage: false,
      showReviewInvite: true,
    };
  }

  const hasEmail = Boolean(normalizedCustomerEmail(booking?.customer_email));
  if (hasEmail) {
    return {
      showReviewSmsMessage: false,
      showReviewInviteMessage: true,
      showNoReviewInviteMessage: false,
      showSmsOptOutMessage: false,
      showReviewInvite: true,
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

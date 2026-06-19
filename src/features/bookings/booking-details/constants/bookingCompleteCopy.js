export const BOOKING_MARK_COMPLETE_CANCEL_LABEL = 'Cancel';

export const BOOKING_MARK_COMPLETE_CONFIRM_LABEL = 'Complete visit';

/** @typedef {'review_sms' | 'review_email' | 'no_review' | null} BookingMarkCompleteHighlightVariant */

/**
 * @typedef {object} BookingMarkCompleteSheetCopy
 * @property {string} title
 * @property {string} body
 * @property {string} confirmLabel
 * @property {BookingMarkCompleteHighlightVariant} highlightVariant
 * @property {string} [highlightTitle]
 * @property {string} [highlightBody]
 */

/**
 * @param {{
 *   showReviewSmsMessage?: boolean;
 *   showReviewInviteMessage?: boolean;
 *   showNoReviewInviteMessage?: boolean;
 * } | null | undefined} modalCopy
 * @returns {BookingMarkCompleteSheetCopy}
 */
export function getBookingMarkCompleteSheetCopy(modalCopy) {
  if (modalCopy?.showReviewSmsMessage) {
    return {
      title: 'Complete this visit?',
      highlightVariant: 'review_sms',
      highlightTitle: "We'll text your customer",
      highlightBody: 'They’ll get a text with their receipt and a link to leave a review.',
      body: 'This visit will be marked complete on your calendar.',
      confirmLabel: BOOKING_MARK_COMPLETE_CONFIRM_LABEL,
    };
  }

  if (modalCopy?.showReviewInviteMessage) {
    return {
      title: 'Complete this visit?',
      highlightVariant: 'review_email',
      highlightTitle: "We'll email your customer",
      highlightBody: 'They’ll get an email with their receipt and a link to leave a review.',
      body: 'This visit will be marked complete on your calendar.',
      confirmLabel: BOOKING_MARK_COMPLETE_CONFIRM_LABEL,
    };
  }

  if (modalCopy?.showNoReviewInviteMessage) {
    return {
      title: 'Complete this visit?',
      highlightVariant: 'no_review',
      highlightTitle: 'No review request',
      highlightBody: 'There’s no phone or email on this booking, so we can’t send a review link.',
      body: 'This visit will be marked complete on your calendar.',
      confirmLabel: BOOKING_MARK_COMPLETE_CONFIRM_LABEL,
    };
  }

  return {
    title: 'Complete this visit?',
    highlightVariant: null,
    body: 'This will mark the appointment as completed on your calendar.',
    confirmLabel: BOOKING_MARK_COMPLETE_CONFIRM_LABEL,
  };
}

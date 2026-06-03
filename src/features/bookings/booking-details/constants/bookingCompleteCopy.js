export const BOOKING_MARK_COMPLETE_CANCEL_LABEL = 'Cancel';

export const BOOKING_MARK_COMPLETE_CONFIRM_LABEL = 'Complete';

/** @typedef {'review_email' | null} BookingMarkCompleteHighlightVariant */

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
 * @param {{ showReviewInviteMessage?: boolean } | null | undefined} modalCopy
 * @returns {BookingMarkCompleteSheetCopy}
 */
export function getBookingMarkCompleteSheetCopy(modalCopy) {
  if (modalCopy?.showReviewInviteMessage) {
    return {
      title: 'Complete this visit?',
      highlightVariant: 'review_email',
      highlightTitle: "We'll send a review request",
      highlightBody: 'Your customer will get an email with a link to rate their visit.',
      body: 'The appointment will be marked complete on your calendar.',
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

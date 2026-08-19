import { COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY } from './markCompleteFeatureFlags';

export const BOOKING_MARK_COMPLETE_CANCEL_LABEL = 'Cancel';

export const BOOKING_MARK_COMPLETE_CONFIRM_LABEL = 'Complete visit';

/** @typedef {'review_sms' | 'review_email' | 'no_review' | 'sms_opt_out' | null} BookingMarkCompleteHighlightVariant */

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
 *   showSmsOptOutMessage?: boolean;
 *   showReviewInvite?: boolean;
 * } | null | undefined} modalCopy
 * @returns {BookingMarkCompleteSheetCopy}
 */
export function getBookingMarkCompleteSheetCopy(modalCopy) {
  if (!COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY) {
    return {
      title: 'Complete this visit?',
      highlightVariant: null,
      body: 'This will mark the appointment as completed on your calendar.',
      confirmLabel: BOOKING_MARK_COMPLETE_CONFIRM_LABEL,
    };
  }

  const includesReviewLink = modalCopy?.showReviewInvite !== false;

  if (modalCopy?.showReviewSmsMessage) {
    return {
      title: 'Complete this visit?',
      highlightVariant: 'review_sms',
      highlightTitle: "We'll text your customer",
      highlightBody: includesReviewLink
        ? 'They’ll get a text with their receipt and a link to leave a review.'
        : 'They’ll get a text with their receipt.',
      body: 'This visit will be marked complete on your calendar.',
      confirmLabel: BOOKING_MARK_COMPLETE_CONFIRM_LABEL,
    };
  }

  if (modalCopy?.showReviewInviteMessage) {
    return {
      title: 'Complete this visit?',
      highlightVariant: 'review_email',
      highlightTitle: "We'll email your customer",
      highlightBody: includesReviewLink
        ? 'They’ll get an email with their receipt and a link to leave a review.'
        : 'They’ll get an email with their receipt.',
      body: 'This visit will be marked complete on your calendar.',
      confirmLabel: BOOKING_MARK_COMPLETE_CONFIRM_LABEL,
    };
  }

  if (modalCopy?.showSmsOptOutMessage) {
    return {
      title: 'Complete this visit?',
      highlightVariant: 'sms_opt_out',
      highlightTitle: 'They opted out of texts',
      highlightBody:
        'We won’t send a receipt or review text. This visit will still be marked complete.',
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

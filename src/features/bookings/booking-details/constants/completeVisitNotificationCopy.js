import { COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY } from './markCompleteFeatureFlags';

/**
 * Customer notification copy for complete visit — no phone numbers or emails in UI.
 *
 * @param {{
 *   showReviewSms?: boolean;
 *   showReviewEmail?: boolean;
 *   showReviewInvite?: boolean;
 *   smsOptedOut?: boolean;
 * }} p
 * @returns {{ visible: boolean; message: string; iconName: 'chatbubble-ellipses-outline' | 'mail-outline' | 'information-circle-outline' }}
 */
export function getCompleteVisitFollowUpMessage(p) {
  if (!COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY) {
    return {
      visible: false,
      message: '',
      iconName: 'information-circle-outline',
    };
  }

  const includesReviewLink = p.showReviewInvite !== false;

  if (p.showReviewSms) {
    return {
      visible: true,
      message: includesReviewLink
        ? "We'll text your customer a receipt and a link to leave a review."
        : "We'll text your customer their receipt.",
      iconName: 'chatbubble-ellipses-outline',
    };
  }

  if (p.showReviewEmail) {
    return {
      visible: true,
      message: includesReviewLink
        ? "We'll email your customer a receipt and a link to leave a review."
        : "We'll email your customer their receipt.",
      iconName: 'mail-outline',
    };
  }

  if (p.smsOptedOut) {
    return {
      visible: true,
      message: 'This customer opted out of texts — they won’t be notified automatically.',
      iconName: 'information-circle-outline',
    };
  }

  return {
    visible: true,
    message: "No phone or email on this booking — your customer won't be notified automatically.",
    iconName: 'information-circle-outline',
  };
}

/**
 * Confirms the appointment itself. Deliberately says nothing about texting or
 * emailing: the server decides what actually goes out, so claiming a channel
 * here can be wrong (and means nothing to owners who can't text).
 *
 * @returns {string}
 */
export function getCompleteVisitSuccessDetail() {
  return 'This appointment is complete and saved to your calendar.';
}

/**
 * @param {{
 *   paidOnline: number;
 *   subtotal: number;
 *   tapToPayAmount: number;
 *   inPersonPayment: { method: string; amount: number } | null;
 *   isMembershipVisit?: boolean;
 * }} p
 * @returns {{ title: string; detail: string }}
 */
export function getCompleteVisitPaymentSettledBanner(p) {
  const sessionCollected = p.tapToPayAmount > 0 || Boolean(p.inPersonPayment);
  const paidOnline = Math.max(0, p.paidOnline);

  if (p.isMembershipVisit && !sessionCollected && paidOnline <= 0) {
    return {
      title: 'Paid in full',
      detail: 'No payment due for this service.',
    };
  }

  if (sessionCollected && paidOnline > 0) {
    return {
      title: 'Paid in full',
      detail: 'Balance collected for this service.',
    };
  }

  if (sessionCollected) {
    return {
      title: 'Paid in full',
      detail: 'Payment collected for this service.',
    };
  }

  if (paidOnline > 0) {
    return {
      title: 'Paid in full',
      detail: 'Paid online before this service.',
    };
  }

  return {
    title: 'Paid in full',
    detail: 'No payment due for this service.',
  };
}

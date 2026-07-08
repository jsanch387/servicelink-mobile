import { COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY } from './markCompleteFeatureFlags';

/**
 * Customer notification copy for complete visit — no phone numbers or emails in UI.
 *
 * @param {{ showReviewSms?: boolean; showReviewEmail?: boolean; showReviewInvite?: boolean }} p
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

  return {
    visible: true,
    message: "No phone or email on this booking — your customer won't be notified automatically.",
    iconName: 'information-circle-outline',
  };
}

/**
 * @param {{ showReviewSms?: boolean; showReviewEmail?: boolean; showReviewInvite?: boolean }} p
 * @returns {string}
 */
export function getCompleteVisitSuccessDetail(p) {
  if (!COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY) {
    return 'This service is marked complete on your calendar.';
  }

  const includesReviewLink = p.showReviewInvite !== false;

  if (p.showReviewSms) {
    return includesReviewLink
      ? 'We texted your customer their receipt and a review link.'
      : 'We texted your customer their receipt.';
  }

  if (p.showReviewEmail) {
    return includesReviewLink
      ? 'We emailed your customer their receipt and a review link.'
      : 'We emailed your customer their receipt.';
  }

  return 'This service is marked complete on your calendar.';
}

/**
 * @param {{
 *   paidOnline: number;
 *   subtotal: number;
 *   tapToPayAmount: number;
 *   inPersonPayment: { method: string; amount: number } | null;
 * }} p
 * @returns {{ title: string; detail: string }}
 */
export function getCompleteVisitPaymentSettledBanner(p) {
  const sessionCollected = p.tapToPayAmount > 0 || Boolean(p.inPersonPayment);
  const paidOnline = Math.max(0, p.paidOnline);

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

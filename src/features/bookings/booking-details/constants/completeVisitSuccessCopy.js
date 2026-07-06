import { getCompleteVisitSuccessDetail } from './completeVisitNotificationCopy';

/**
 * @param {{
 *   customerEmail?: string;
 *   showInvoiceEmail?: boolean;
 *   showReviewSms?: boolean;
 *   showReviewEmail?: boolean;
 *   showReviewInvite?: boolean;
 * }} p
 * @returns {{ title: string; detail: string }}
 */
export function getCompleteVisitSuccessCopy(p) {
  return {
    title: 'Complete',
    detail: getCompleteVisitSuccessDetail(p),
  };
}

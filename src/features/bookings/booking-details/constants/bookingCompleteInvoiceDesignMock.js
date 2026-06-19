import { getCompleteVisitFollowUpMessage } from './completeVisitNotificationCopy';

/** Static mock data for complete-visit design previews (no API). */

export const BOOKING_COMPLETE_INVOICE_DESIGN_MOCK = {
  customerFirstName: 'Jane',
  customerEmail: 'jane.doe@email.com',
  lineItems: [
    { id: 'service', label: 'Full Detail', sublabel: 'Large SUV', amount: 120 },
    { id: 'addon-1', label: 'Engine bay add-on', amount: 25 },
  ],
  /** Amount already collected online (partial = deposit, equals total = paid in full). */
  paidOnline: 0,
  /** `pay_in_person` | `deposit` | `paid_online` — shapes complete-visit payment UI in design preview. */
  paymentScenario: 'pay_in_person',
  showReviewInvite: true,
  showReviewEmail: true,
  showReviewSms: false,
  showInvoiceEmail: true,
};

/**
 * Matches booking details payment copy: partial online payment is a deposit, not generic "paid online".
 *
 * @param {number} paidOnline
 * @param {number} amountDue
 */
export function getCompleteVisitPaidRowLabel(paidOnline, amountDue) {
  const paid = Math.max(0, Number(paidOnline) || 0);
  if (paid <= 0) {
    return null;
  }
  if (amountDue > 0) {
    return 'Deposit paid';
  }
  return 'Paid in full';
}

/**
 * @param {{
 *   showInvoiceEmail?: boolean;
 *   showReviewSms?: boolean;
 *   showReviewEmail?: boolean;
 *   showReviewInvite?: boolean;
 * }} p
 * @returns {{ visible: boolean; message: string; iconName: string }}
 */
export function getCompleteVisitFollowUpInfo(p) {
  return getCompleteVisitFollowUpMessage({
    showReviewSms: Boolean(p.showReviewSms),
    showReviewEmail: Boolean(p.showReviewEmail ?? p.showReviewInvite),
  });
}

/** @deprecated Use {@link getCompleteVisitFollowUpInfo} */
export function getCompleteVisitFollowUpCopy(p) {
  return getCompleteVisitFollowUpInfo(p).message;
}

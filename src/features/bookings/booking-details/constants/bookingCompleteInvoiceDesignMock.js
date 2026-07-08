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
 * Applies {@link BOOKING_COMPLETE_INVOICE_DESIGN_MOCK.paymentScenario} for design previews.
 *
 * @returns {import('../utils/buildCompleteVisitModel').CompleteVisitModel}
 */
export function resolveCompleteVisitDesignMock() {
  const baseSubtotal = BOOKING_COMPLETE_INVOICE_DESIGN_MOCK.lineItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  let paidOnline = BOOKING_COMPLETE_INVOICE_DESIGN_MOCK.paidOnline;
  let remainingAmountCents = Math.max(0, Math.round((baseSubtotal - paidOnline) * 100));

  switch (BOOKING_COMPLETE_INVOICE_DESIGN_MOCK.paymentScenario) {
    case 'paid_online':
      paidOnline = baseSubtotal;
      remainingAmountCents = 0;
      break;
    case 'deposit':
      paidOnline = 50;
      remainingAmountCents = Math.max(0, Math.round((baseSubtotal - paidOnline) * 100));
      break;
    default:
      paidOnline = 0;
      remainingAmountCents = Math.round(baseSubtotal * 100);
      break;
  }

  const paidOnlineCents = Math.round(paidOnline * 100);

  return {
    ...BOOKING_COMPLETE_INVOICE_DESIGN_MOCK,
    paidOnline,
    remainingAmountCents,
    isPaidInFullOnline: paidOnlineCents > 0 && remainingAmountCents === 0,
    customerEmail:
      BOOKING_COMPLETE_INVOICE_DESIGN_MOCK.paymentScenario === 'paid_online'
        ? BOOKING_COMPLETE_INVOICE_DESIGN_MOCK.customerEmail
        : null,
    showInvoiceEmail: BOOKING_COMPLETE_INVOICE_DESIGN_MOCK.paymentScenario === 'paid_online',
  };
}

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
    showReviewInvite: p.showReviewInvite,
  });
}

/** @deprecated Use {@link getCompleteVisitFollowUpInfo} */
export function getCompleteVisitFollowUpCopy(p) {
  return getCompleteVisitFollowUpInfo(p).message;
}

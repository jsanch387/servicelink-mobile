/** Static mock data for complete-visit design previews (no API). */

export const BOOKING_COMPLETE_INVOICE_DESIGN_MOCK = {
  customerFirstName: 'Jane',
  customerEmail: 'jane.doe@email.com',
  lineItems: [
    { id: 'service', label: 'Full Detail (Large SUV)', amount: 120 },
    { id: 'addon-1', label: 'Engine bay add-on', amount: 25 },
  ],
  /** Amount already collected online (partial = deposit, equals total = paid in full). */
  paidOnline: 0,
  /** `pay_in_person` | `deposit` | `paid_online` — shapes complete-visit payment UI in design preview. */
  paymentScenario: 'pay_in_person',
  showReviewInvite: true,
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
 *   customerEmail?: string;
 *   showInvoiceEmail?: boolean;
 *   showReviewInvite?: boolean;
 * }} p
 * @returns {{ visible: boolean; email: string | null; message: string }}
 */
export function getCompleteVisitFollowUpInfo(p) {
  const email = String(p.customerEmail ?? '').trim();
  const sendsInvoice = Boolean(p.showInvoiceEmail);
  const sendsReview = Boolean(p.showReviewInvite);

  if (!email) {
    return {
      visible: true,
      email: null,
      message: 'No email on file — nothing will be sent automatically.',
    };
  }

  if (sendsInvoice && sendsReview) {
    return {
      visible: true,
      email,
      message: "They'll get an invoice and a link to leave a review.",
    };
  }
  if (sendsInvoice) {
    return {
      visible: true,
      email,
      message: "They'll get an invoice.",
    };
  }
  if (sendsReview) {
    return {
      visible: true,
      email,
      message: "They'll get a link to leave a review.",
    };
  }

  return {
    visible: true,
    email,
    message: 'This visit will be marked complete on your calendar.',
  };
}

/** @deprecated Use {@link getCompleteVisitFollowUpInfo} */
export function getCompleteVisitFollowUpCopy(p) {
  const info = getCompleteVisitFollowUpInfo(p);
  if (info.email) {
    return `${info.email} — ${info.message}`;
  }
  return info.message;
}

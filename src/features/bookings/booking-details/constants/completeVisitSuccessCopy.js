/**
 * @param {{
 *   customerEmail?: string;
 *   showInvoiceEmail?: boolean;
 *   showReviewInvite?: boolean;
 * }} p
 * @returns {{ title: string; detail: string }}
 */
export function getCompleteVisitSuccessCopy(p) {
  const email = String(p.customerEmail ?? '').trim();
  const sendsInvoice = Boolean(p.showInvoiceEmail);
  const sendsReview = Boolean(p.showReviewInvite);

  if (email && sendsInvoice && sendsReview) {
    return {
      title: 'Visit complete',
      detail: `We sent an invoice and review link to ${email}.`,
    };
  }
  if (email && sendsInvoice) {
    return {
      title: 'Visit complete',
      detail: `We sent an invoice to ${email}.`,
    };
  }
  if (email && sendsReview) {
    return {
      title: 'Visit complete',
      detail: `We sent a review link to ${email}.`,
    };
  }

  return {
    title: 'Visit complete',
    detail: 'This visit is marked complete on your calendar.',
  };
}

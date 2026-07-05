/**
 * @param {Record<string, unknown> | null | undefined} booking
 */
export function bookingHasCompleteVisitPaymentSummary(booking) {
  if (!booking || typeof booking !== 'object') {
    return false;
  }
  const payment = booking.payment;
  if (!payment || typeof payment !== 'object') {
    return false;
  }
  return (
    payment.paidOnlineAmountCents != null ||
    payment.paid_online_amount_cents != null ||
    payment.remainingAmountCents != null ||
    payment.remaining_amount_cents != null
  );
}

/**
 * Customer paid the full booking total online before the visit — no in-person collection needed.
 *
 * @param {{
 *   paidOnlineCents: number;
 *   remainingAmountCents?: number | null;
 *   subtotalCents: number;
 * }} params
 */
export function isCompleteVisitPaidInFullOnline({
  paidOnlineCents,
  remainingAmountCents = null,
  subtotalCents,
}) {
  const paidOnline = Math.max(0, Number(paidOnlineCents) || 0);
  if (paidOnline <= 0) {
    return false;
  }

  if (remainingAmountCents != null && Number.isFinite(Number(remainingAmountCents))) {
    return Math.max(0, Math.round(Number(remainingAmountCents))) === 0;
  }

  const subtotal = Math.max(0, Math.round(Number(subtotalCents) || 0));
  return paidOnline >= subtotal;
}

/**
 * @param {Record<string, unknown> | null | undefined} booking
 */
export function bookingNeedsCompleteVisitDetailsFetch(booking) {
  if (!booking || typeof booking !== 'object') {
    return true;
  }
  const hasPricing =
    booking.service_price_cents != null ||
    booking.addon_details != null ||
    booking.service_price != null;
  return !hasPricing || !bookingHasCompleteVisitPaymentSummary(booking);
}

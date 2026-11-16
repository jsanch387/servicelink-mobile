import { previewTaxCents } from '../../payments/utils/taxRateModel';

/**
 * Sales tax for a booking. A frozen rate always wins over stored `tax_cents`.
 * Membership visits and a missing or 0 rate keep the previous rule: no tax, or the stored amount.
 *
 * @param {{
 *   taxableBaseCents?: number | null;
 *   taxRateBps?: number | null;
 *   storedTaxCents?: number | null;
 *   isMembershipVisit?: boolean;
 * }} input
 * @returns {number}
 */
export function resolveBookingTaxCents({
  taxableBaseCents = 0,
  taxRateBps = null,
  storedTaxCents = 0,
  isMembershipVisit = false,
} = {}) {
  if (isMembershipVisit) return 0;
  const base = Math.max(0, Math.round(Number(taxableBaseCents) || 0));
  const bps = Math.round(Number(taxRateBps));
  if (Number.isFinite(bps) && bps > 0) {
    return previewTaxCents(base, bps);
  }
  return Math.max(0, Math.round(Number(storedTaxCents) || 0));
}

/**
 * `booking_payments` total and remaining after a price change.
 * Total includes session fees and tax. Remaining matches `booking_payments_remaining_consistency`.
 *
 * @param {{
 *   taxableBaseCents?: number | null;
 *   taxRateBps?: number | null;
 *   storedTaxCents?: number | null;
 *   isMembershipVisit?: boolean;
 *   sessionFeeCents?: number | null;
 *   paidOnlineCents?: number | null;
 *   sessionDiscountCents?: number | null;
 *   sessionPaymentCents?: number | null;
 * }} input
 */
export function resolveBookingPaymentTotals({
  taxableBaseCents = 0,
  taxRateBps = null,
  storedTaxCents = 0,
  isMembershipVisit = false,
  sessionFeeCents = 0,
  paidOnlineCents = 0,
  sessionDiscountCents = 0,
  sessionPaymentCents = 0,
} = {}) {
  const base = Math.max(0, Math.round(Number(taxableBaseCents) || 0));
  const fees = Math.max(0, Math.round(Number(sessionFeeCents) || 0));
  const paid = Math.max(0, Math.round(Number(paidOnlineCents) || 0));
  const sessionDiscounts = Math.max(0, Math.round(Number(sessionDiscountCents) || 0));
  const sessionPayment = Math.max(0, Math.round(Number(sessionPaymentCents) || 0));
  const taxCents = resolveBookingTaxCents({
    taxableBaseCents: base,
    taxRateBps,
    storedTaxCents,
    isMembershipVisit,
  });
  const totalCents = Math.max(fees, base + fees) + taxCents;
  const remainingCents = Math.max(0, totalCents - paid - sessionDiscounts - sessionPayment);
  return { taxCents, totalCents, remainingCents };
}

import { formatTaxLineLabel, previewTaxCents } from '../../payments/utils/taxRateModel';

/**
 * @param {number} priceCents
 */
function noTax(priceCents) {
  return {
    taxCents: 0,
    taxRateBps: null,
    label: 'Tax',
    totalCents: priceCents,
  };
}

/**
 * Tax on an invoice's line subtotal.
 * A booking invoice uses that appointment's stored tax. `tax_cents` of 0 stays untaxed.
 * Any other invoice uses the current shop rate.
 *
 * @param {{
 *   subtotalCents?: number | null;
 *   shopTaxEnabled?: boolean;
 *   shopTaxRateBps?: number | null;
 *   bookingPayment?: { found?: boolean; taxCents?: number; taxRateBps?: number | null } | null;
 * }} args
 */
export function previewInvoiceTax({
  subtotalCents,
  shopTaxEnabled = false,
  shopTaxRateBps = null,
  bookingPayment = null,
} = {}) {
  const price = Math.max(0, Math.round(Number(subtotalCents) || 0));
  if (bookingPayment) {
    const stored = Math.max(0, Math.round(Number(bookingPayment.taxCents) || 0));
    if (!bookingPayment.found || stored <= 0 || price <= 0) return noTax(price);
    const rate = Math.round(Number(bookingPayment.taxRateBps));
    const hasRate = Number.isFinite(rate) && rate >= 1;
    const taxCents = hasRate ? previewTaxCents(price, rate) : stored;
    return {
      taxCents,
      taxRateBps: taxCents > 0 && hasRate ? rate : null,
      label: formatTaxLineLabel(hasRate ? rate : null),
      totalCents: price + taxCents,
    };
  }

  const taxCents = shopTaxEnabled ? previewTaxCents(price, shopTaxRateBps) : 0;
  return {
    taxCents,
    taxRateBps: taxCents > 0 ? shopTaxRateBps : null,
    label: formatTaxLineLabel(shopTaxRateBps),
    totalCents: price + taxCents,
  };
}

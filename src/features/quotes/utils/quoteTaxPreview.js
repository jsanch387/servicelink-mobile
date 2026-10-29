import { previewTaxCents, formatTaxLineLabel } from '../../payments/utils/taxRateModel';

/**
 * Dollars typed in the quote price field, as cents. Empty or $0 is 0.
 *
 * @param {string | number | null | undefined} priceUsdText
 */
export function quotePriceTextToCents(priceUsdText) {
  const n = parseFloat(
    String(priceUsdText ?? '')
      .replace(/[$,]/g, '')
      .trim(),
  );
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

/**
 * @param {number | null | undefined} usd
 */
export function quoteUsdToCents(usd) {
  const n = Number(usd);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

/**
 * Shop-rate preview for a quote price. The send body stays pre-tax; the server writes tax.
 * Tax is off, or the price is $0 → `taxCents` 0.
 *
 * @param {{
 *   priceCents?: number | null;
 *   taxEnabled?: boolean;
 *   taxRateBps?: number | null;
 * }} args
 */
export function buildQuoteTaxPreview({ priceCents, taxEnabled = false, taxRateBps = null } = {}) {
  const price = Math.max(0, Math.round(Number(priceCents) || 0));
  const taxCents = taxEnabled ? previewTaxCents(price, taxRateBps) : 0;
  return {
    priceCents: price,
    taxCents,
    taxRateBps: taxCents > 0 ? taxRateBps : null,
    customerPaysCents: price + taxCents,
    label: formatTaxLineLabel(taxRateBps),
  };
}

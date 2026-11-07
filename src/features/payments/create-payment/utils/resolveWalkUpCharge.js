import { formatUsdFromCents } from '../../../bookings/create-appointment/utils/priceLabelMath';
import { formatTaxLineLabel, previewTaxCents } from '../../utils/taxRateModel';

/**
 * Walk-up Tap to pay and payment links charge the typed price plus shop tax.
 * The typed amount stays pre-tax. The request amount is what the customer pays.
 *
 * @param {{
 *   priceCents: number;
 *   taxEnabled?: boolean;
 *   taxRateBps?: number | null;
 * }} input
 */
export function resolveWalkUpCharge({ priceCents, taxEnabled = false, taxRateBps = null }) {
  const price = Math.max(0, Math.round(Number(priceCents) || 0));
  const rate = Math.round(Number(taxRateBps));
  const canTax = Boolean(taxEnabled) && Number.isFinite(rate) && rate >= 1 && price > 0;
  const taxCents = canTax ? previewTaxCents(price, rate) : 0;
  const chargeCents = price + taxCents;

  return {
    priceCents: price,
    taxCents,
    taxRateBps: taxCents > 0 ? rate : null,
    chargeCents,
    taxCaption:
      taxCents > 0
        ? `${formatTaxLineLabel(rate)} ${formatUsdFromCents(taxCents, { forceCents: true })}`
        : null,
    totalCaption:
      taxCents > 0 ? `Total ${formatUsdFromCents(chargeCents, { forceCents: true })}` : null,
  };
}

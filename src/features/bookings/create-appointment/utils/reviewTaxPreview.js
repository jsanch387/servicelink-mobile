import { previewTaxCents } from '../../../payments/utils/taxRateModel';

/**
 * Review-step tax. Membership visits stay $0. The create request does not send these fields.
 *
 * @param {{
 *   isMembershipVisit?: boolean;
 *   priceAfterDiscountCents?: number;
 *   taxEnabled?: boolean;
 *   taxRateBps?: number | null;
 * }} args
 */
export function buildReviewTaxPreview({
  isMembershipVisit = false,
  priceAfterDiscountCents = 0,
  taxEnabled = false,
  taxRateBps = null,
} = {}) {
  const price = Math.max(0, Math.round(Number(priceAfterDiscountCents) || 0));
  if (isMembershipVisit || !taxEnabled || price <= 0) {
    return {
      priceAfterDiscountCents: isMembershipVisit ? 0 : price,
      taxCents: 0,
      taxRateBps: null,
      customerPaysCents: isMembershipVisit ? 0 : price,
    };
  }

  const taxCents = previewTaxCents(price, taxRateBps);
  return {
    priceAfterDiscountCents: price,
    taxCents,
    taxRateBps: taxCents > 0 ? taxRateBps : null,
    customerPaysCents: price + taxCents,
  };
}

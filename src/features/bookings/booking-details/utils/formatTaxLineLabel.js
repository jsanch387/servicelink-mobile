/**
 * `Tax (2.25%)` from the stored basis points. `Tax` when the rate is missing.
 * Does not calculate the tax amount.
 *
 * @param {number | null | undefined} taxRateBps
 * @returns {string}
 */
export function formatTaxLineLabel(taxRateBps) {
  const n = Math.round(Number(taxRateBps));
  if (!Number.isFinite(n) || n < 1) {
    return 'Tax';
  }
  const percent = (n / 100).toFixed(2).replace(/\.?0+$/, '');
  return `Tax (${percent}%)`;
}

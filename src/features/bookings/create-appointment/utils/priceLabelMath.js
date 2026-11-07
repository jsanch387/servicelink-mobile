/**
 * Parses a display price like "$200", "+$35", or "$1,234" into a USD number for math only.
 */
export function parsePriceLabelToUsd(label) {
  const cleaned = String(label ?? '').replace(/,/g, '');
  const m = cleaned.match(/([0-9]+(?:\.[0-9]{1,2})?)/);
  if (!m) return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : 0;
}

export function formatUsdFromNumber(dollars) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(dollars);
}

/**
 * Cents → USD. Whole dollars stay `$85` unless `forceCents` is set (`$1.91`, `$86.91`).
 *
 * @param {number} cents
 * @param {{ forceCents?: boolean }} [options]
 */
export function formatUsdFromCents(cents, { forceCents = false } = {}) {
  const rounded = Math.round(Number(cents) || 0);
  const showCents = forceCents || rounded % 100 !== 0;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rounded / 100);
}

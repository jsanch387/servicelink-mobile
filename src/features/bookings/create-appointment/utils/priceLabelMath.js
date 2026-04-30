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

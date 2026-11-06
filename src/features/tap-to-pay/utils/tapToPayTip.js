/** Suggested tip percents, in display order. */
export const TAP_TO_PAY_TIP_PRESETS = [15, 20, 25];

/** Matches the create-payment keypad cap. */
export const TAP_TO_PAY_TIP_MAX_CENTS = 999999;

/**
 * @param {number} cents
 * @returns {string}
 */
export function formatTipUsd(cents) {
  const safe = Number.isFinite(cents) ? cents : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(safe / 100);
}

/**
 * @param {number} baseCents
 * @param {number} percent
 * @returns {number}
 */
export function tipCentsFromPercent(baseCents, percent) {
  const base = Math.max(0, Math.round(Number(baseCents) || 0));
  const rate = Math.round(Number(percent) || 0);
  if (base <= 0 || rate <= 0) {
    return 0;
  }
  return Math.round((base * rate) / 100);
}

/**
 * @param {string} raw
 * @returns {number | null}
 */
export function parseTipAmountInputToCents(raw) {
  const cleaned = String(raw ?? '').replace(/[^0-9.]/g, '');
  if (!cleaned || cleaned === '.') {
    return null;
  }
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  const cents = Math.round(value * 100);
  if (cents <= 0 || cents > TAP_TO_PAY_TIP_MAX_CENTS) {
    return null;
  }
  return cents;
}

/** Session-fee label the complete-job Tap to Pay charge uses for a customer tip. */
export const TAP_TO_PAY_TIP_LABEL = 'Tip';

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

/**
 * @param {Array<{ label: string; amountCents: number }>} sessionFees
 * @param {number} tipCents
 * @returns {Array<{ label: string; amountCents: number }>}
 */
export function appendTapToPayTipFee(sessionFees, tipCents) {
  const fees = Array.isArray(sessionFees) ? sessionFees.slice() : [];
  const cents = Math.round(Number(tipCents) || 0);
  if (cents <= 0) {
    return fees;
  }
  fees.push({ label: TAP_TO_PAY_TIP_LABEL, amountCents: cents });
  return fees;
}

/**
 * @param {Array<{ label: string; amount: number }>} sessionFees
 * @param {number} tipCents
 * @returns {Array<{ label: string; amount: number }>}
 */
export function appendTapToPayTipCheckoutFee(sessionFees, tipCents) {
  const fees = Array.isArray(sessionFees) ? sessionFees.slice() : [];
  const cents = Math.round(Number(tipCents) || 0);
  if (cents <= 0) {
    return fees;
  }
  fees.push({ label: TAP_TO_PAY_TIP_LABEL, amount: cents / 100 });
  return fees;
}

import { sanitizeFixedDepositInput } from '../../utils/depositAmountModel';

/** Keeps the 64pt amount hero on a phone-width card. */
export const CREATE_PAYMENT_MAX_INTEGER_DIGITS = 4;

/** Stripe Checkout / Terminal minimum ($0.50). */
export const CREATE_PAYMENT_MIN_AMOUNT = 0.5;

export const CREATE_PAYMENT_MIN_AMOUNT_CENTS = 50;

export const CREATE_PAYMENT_MAX_AMOUNT = 9_999.99;

export const CREATE_PAYMENT_MAX_AMOUNT_CENTS = 999_999;

/** Server `note` max for walk-up payment link and Tap to Pay. */
export const CREATE_PAYMENT_NOTE_MAX_LENGTH = 200;

/** Typed amount: digits + optional cents, capped so it cannot run off-screen. */
export function sanitizeCreatePaymentAmountInput(raw) {
  const next = sanitizeFixedDepositInput(raw);
  const dot = next.indexOf('.');
  if (dot === -1) {
    return next.slice(0, CREATE_PAYMENT_MAX_INTEGER_DIGITS);
  }
  return `${next.slice(0, Math.min(dot, CREATE_PAYMENT_MAX_INTEGER_DIGITS))}.${next.slice(dot + 1)}`;
}

/** @param {string | number | null | undefined} raw */
export function parseCreatePaymentAmount(raw) {
  const n = Number(String(raw ?? '').trim());
  if (!Number.isFinite(n) || n < CREATE_PAYMENT_MIN_AMOUNT || n > CREATE_PAYMENT_MAX_AMOUNT) {
    return null;
  }
  return Math.round(n * 100) / 100;
}

/** @param {string | null | undefined} raw */
export function hasCreatePaymentNote(raw) {
  return String(raw ?? '').trim().length > 0;
}

/** @param {string | null | undefined} raw */
export function sanitizeCreatePaymentNote(raw) {
  return String(raw ?? '')
    .trim()
    .slice(0, CREATE_PAYMENT_NOTE_MAX_LENGTH);
}

/** @param {number | null | undefined} amount */
export function formatCreatePaymentDollars(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) {
    return '$0';
  }
  const cents = Math.round(n * 100);
  const showCents = cents % 100 !== 0;
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
}

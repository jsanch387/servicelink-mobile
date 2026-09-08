import { normalizeCustomJobPriceInput } from '../../../components/ui';

/** Digits + one dot, max two cents digits. */
export function sanitizeExpenseAmountInput(raw) {
  const cleaned = normalizeCustomJobPriceInput(raw);
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned;
  return `${cleaned.slice(0, dot + 1)}${cleaned.slice(dot + 1, dot + 3)}`;
}

/** Format a dollar amount for list and totals (`$72` or `$48.27`). */
export function formatExpenseDollars(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '$0';
  const cents = Math.round(n * 100);
  const showCents = cents % 100 !== 0;
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
}

/** Parse a typed dollar string. Returns null when empty or not a positive amount. */
export function parseExpenseAmount(raw) {
  const n = Number(String(raw ?? '').trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export function sumExpenseAmounts(expenses) {
  return (expenses ?? []).reduce((total, item) => {
    const n = Number(item?.amount);
    return total + (Number.isFinite(n) ? n : 0);
  }, 0);
}

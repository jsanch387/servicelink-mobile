/** Shop sales tax cap: 25% is 2500 basis points. Smallest on rate is 1 (0.01%). */
export const TAX_RATE_MAX_PERCENT = 25;
export const TAX_RATE_MAX_BPS = 2500;

/**
 * Tax percent while typing: digits, one dot, two decimals, value ≤ 25.
 * Trailing `.` stays so the field can be edited.
 *
 * @param {string} input
 */
export function sanitizeTaxPercentInput(input) {
  let s = String(input ?? '').replace(/[^\d.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }
  if (s === '') return '';
  if (s === '.') return '0.';

  const hasTrailingDot = s.endsWith('.') && s.indexOf('.') === s.length - 1;
  const base = hasTrailingDot ? s.slice(0, -1) : s;
  const restoreTrailingDot = hasTrailingDot && base !== '';

  const dotInBase = base.indexOf('.');
  let intPart;
  let fracPart;
  if (dotInBase === -1) {
    intPart = base;
    fracPart = '';
  } else {
    intPart = base.slice(0, dotInBase).replace(/\D/g, '');
    fracPart = base
      .slice(dotInBase + 1)
      .replace(/\D/g, '')
      .slice(0, 2);
  }

  if (intPart === '' && fracPart === '') {
    return restoreTrailingDot ? '0.' : '';
  }
  if (intPart === '' && fracPart !== '') {
    intPart = '0';
  }

  intPart = intPart.replace(/^0+(?=\d)/, '');

  let intNum = parseInt(intPart, 10);
  if (Number.isNaN(intNum)) intNum = 0;
  if (intNum > TAX_RATE_MAX_PERCENT) {
    return String(TAX_RATE_MAX_PERCENT);
  }
  if (intNum === TAX_RATE_MAX_PERCENT) {
    const nonzeroFrac = fracPart.replace(/0/g, '') !== '';
    if (nonzeroFrac) return String(TAX_RATE_MAX_PERCENT);
    let capped = fracPart.length > 0 || dotInBase !== -1 ? `${intPart}.${fracPart}` : intPart;
    if (restoreTrailingDot && !capped.endsWith('.')) capped += '.';
    return capped;
  }

  let out = fracPart.length > 0 || dotInBase !== -1 ? `${intPart}.${fracPart}` : intPart;
  if (restoreTrailingDot && !out.endsWith('.')) {
    out += '.';
  }
  return out;
}

/**
 * Keypad percent → basis points. `8.25` → `825`. Empty, 0, and above 25% are null.
 *
 * @param {string | number | null | undefined} raw
 * @returns {number | null}
 */
export function percentStringToTaxRateBps(raw) {
  const normalized = String(raw ?? '')
    .replace(/,/g, '')
    .trim();
  if (normalized === '' || normalized === '.') return null;
  const parseable = normalized.endsWith('.') ? normalized.slice(0, -1) : normalized;
  if (!/^\d+(\.\d+)?$/.test(parseable)) return null;

  const [intPart, fracPart = ''] = parseable.split('.');
  const whole = parseInt(intPart, 10);
  if (!Number.isFinite(whole)) return null;
  const digits = fracPart.replace(/\D/g, '');
  const hundredths = digits.slice(0, 2).padEnd(2, '0');
  let bps = whole * 100 + parseInt(hundredths, 10);
  if (digits.length > 2 && digits[2] >= '5') bps += 1;
  if (bps < 1 || bps > TAX_RATE_MAX_BPS) return null;
  return bps;
}

/**
 * True when the switch can stay on: 0.01% through 25%.
 *
 * @param {string | number | null | undefined} raw
 */
export function isSaveableTaxRate(raw) {
  return percentStringToTaxRateBps(raw) != null;
}

/**
 * Basis points → the rate field. `825` → `8.25`. Missing or 0 stays blank.
 *
 * @param {number | string | null | undefined} bps
 */
export function taxRateBpsToPercentString(bps) {
  const n = Math.round(Number(bps));
  if (!Number.isFinite(n) || n < 1) return '';
  const capped = Math.min(n, TAX_RATE_MAX_BPS);
  return (capped / 100).toFixed(2);
}

/**
 * Tax on the price after discounts. `8500` cents at `225` bps (2.25%) is `191` cents.
 * A missing rate, a rate below 1 basis point, or a $0 price is no tax.
 *
 * @param {number | null | undefined} priceAfterDiscountCents
 * @param {number | null | undefined} taxRateBps
 */
export function previewTaxCents(priceAfterDiscountCents, taxRateBps) {
  const price = Math.round(Number(priceAfterDiscountCents));
  const bps = Math.round(Number(taxRateBps));
  if (!Number.isFinite(price) || price <= 0) return 0;
  if (!Number.isFinite(bps) || bps < 1) return 0;
  return Math.round((price * bps) / 10000);
}

/**
 * `Tax (2.25%)` from basis points. `Tax` when the rate is missing.
 *
 * @param {number | null | undefined} taxRateBps
 */
export function formatTaxLineLabel(taxRateBps) {
  const n = Math.round(Number(taxRateBps));
  if (!Number.isFinite(n) || n < 1) return 'Tax';
  const percent = (n / 100).toFixed(2).replace(/\.?0+$/, '');
  return `Tax (${percent}%)`;
}

/**
 * Columns to merge into a `payment_settings` update.
 * Turning tax off does not send `tax_rate_bps`, so the stored rate stays.
 * Omitting `collectTax` leaves both columns untouched.
 *
 * @param {{ collectTax?: boolean; taxRate?: string }} args
 * @returns {{ fields: Record<string, boolean | number>; error: Error | null }}
 */
export function buildTaxSettingsPatch({ collectTax, taxRate } = {}) {
  if (typeof collectTax !== 'boolean') {
    return { fields: {}, error: null };
  }
  if (!collectTax) {
    return { fields: { tax_enabled: false }, error: null };
  }
  const bps = percentStringToTaxRateBps(taxRate);
  if (bps == null) {
    return {
      fields: {},
      error: new Error('Enter a sales tax rate from 0.01% to 25%.'),
    };
  }
  return { fields: { tax_enabled: true, tax_rate_bps: bps }, error: null };
}

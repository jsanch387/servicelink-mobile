import { DEPOSIT_TYPE_API, depositModeToApiType } from '../constants/depositAmount';

/** Fixed USD: digits + one dot, max two fractional digits (typing). */
export function sanitizeFixedDepositInput(raw) {
  let s = String(raw ?? '').replace(/[^0-9.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot === -1) return s;
  const intPart = s.slice(0, firstDot + 1);
  const decPart = s
    .slice(firstDot + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  return intPart + decPart;
}

/**
 * Percentage while typing: digits + one optional dot, max two decimals, value ≤ 100;
 * `100` drops fraction; trailing `.` allowed while editing.
 */
export function sanitizePercentageDepositInput(input) {
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
  if (intNum > 100) {
    return '100';
  }
  if (intNum === 100) {
    return '100';
  }

  let out = fracPart.length > 0 || dotInBase !== -1 ? `${intPart}.${fracPart}` : intPart;
  if (restoreTrailingDot && !out.endsWith('.')) {
    out += '.';
  }
  return out;
}

/**
 * Save payload shape (reference for API). `depositValue`: cents when fixed, whole percent when percent.
 */
export function buildDepositSavePayload({ depositsEnabled, depositMode, depositAmount }) {
  const normalized = String(depositAmount ?? '')
    .replace(/,/g, '')
    .trim();
  const depositType = depositModeToApiType(depositMode);
  let depositValue = 0;

  if (depositType === DEPOSIT_TYPE_API.FIXED) {
    const n = parseFloat(normalized.endsWith('.') ? normalized.slice(0, -1) : normalized);
    if (Number.isNaN(n) || n < 0) depositValue = 0;
    else depositValue = Math.round(n * 100);
  } else {
    const parseable = normalized.endsWith('.') ? normalized.slice(0, -1) : normalized;
    const n = parseFloat(parseable);
    if (Number.isNaN(n)) depositValue = 0;
    else depositValue = Math.min(100, Math.max(0, Math.round(n)));
  }

  return {
    depositsEnabled: Boolean(depositsEnabled),
    depositType,
    depositValue,
  };
}

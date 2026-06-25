import { TAP_TO_PAY_IOS_UPDATE_REQUIRED } from '../constants/tapToPayCopy';

/** Stripe Terminal / ProximityReader codes for unsupported iOS (Apple checklist 5.1.3). */
const TAP_TO_PAY_OS_VERSION_ERROR_CODES = new Set([
  '2910',
  'OS_VERSION_NOT_SUPPORTED',
  'UNSUPPORTED_MOBILE_DEVICE_CONFIGURATION',
]);

/**
 * Whether a Terminal SDK error is Apple's `PaymentCardReaderError.osVersionNotSupported`
 * (or Stripe's equivalent unsupported-mobile-device / OS version failure).
 *
 * @param {string | null | undefined} code
 * @param {string | null | undefined} message
 */
export function isTapToPayOsVersionTerminalError(code, message) {
  const normalizedCode = String(code ?? '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '_');

  if (TAP_TO_PAY_OS_VERSION_ERROR_CODES.has(normalizedCode)) {
    return true;
  }
  if (normalizedCode.includes('OS_VERSION') && normalizedCode.includes('NOT_SUPPORTED')) {
    return true;
  }
  if (normalizedCode.includes('OSVERSIONNOTSUPPORTED')) {
    return true;
  }

  const lower = String(message ?? '').toLowerCase();
  if (lower.includes('os version not supported')) {
    return true;
  }
  if (lower.includes('osversionnotsupported')) {
    return true;
  }
  if (lower.includes('paymentcardreadererror.osversionnotsupported')) {
    return true;
  }
  if (
    lower.includes('unsupported mobile device configuration') &&
    (lower.includes('ios') || lower.includes('os version'))
  ) {
    return true;
  }

  return false;
}

/**
 * @param {string | null | undefined} code
 * @param {string | null | undefined} message
 * @returns {string | null}
 */
export function mapTapToPayOsVersionTerminalError(code, message) {
  if (!isTapToPayOsVersionTerminalError(code, message)) {
    return null;
  }
  return TAP_TO_PAY_IOS_UPDATE_REQUIRED;
}

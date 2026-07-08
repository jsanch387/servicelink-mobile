import { TAP_TO_PAY_RECEIPT_ROW_LABEL } from '../../../tap-to-pay/constants/tapToPayCopy';

/**
 * @param {string | null | undefined} method
 */
export function getSessionPaymentMethodLabel(method) {
  switch (
    String(method ?? '')
      .trim()
      .toLowerCase()
  ) {
    case 'tap_to_pay':
      return 'Tap to Pay';
    case 'cash':
      return 'Cash';
    case 'payment_app':
      return 'Payment app';
    default:
      return 'Other';
  }
}

/**
 * Receipt-style row label for price breakdown (matches Complete visit sheet).
 *
 * @param {string | null | undefined} method
 */
export function getSessionPaymentRowLabel(method) {
  switch (
    String(method ?? '')
      .trim()
      .toLowerCase()
  ) {
    case 'tap_to_pay':
      return TAP_TO_PAY_RECEIPT_ROW_LABEL;
    case 'cash':
      return 'Paid in cash';
    case 'payment_app':
      return 'Paid via payment app';
    default:
      return 'Paid · Other';
  }
}

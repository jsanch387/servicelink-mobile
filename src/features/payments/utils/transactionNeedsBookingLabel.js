import { localBookingPaymentId } from '../api/fetchTransactionBookingLabels';
import {
  isGenericMultiJobTitle,
  splitPaymentsTransactionTitle,
  stripGenericMultiJobLabel,
} from './splitPaymentsTransactionTitle';

function cleanService(value) {
  const raw = stripGenericMultiJobLabel(value);
  return raw && !isGenericMultiJobTitle(raw) ? raw : '';
}

/**
 * True when the feed painted “Mixed jobs” / empty service and we can look up the booking.
 *
 * @param {import('../constants/paymentsTransactions').PaymentsTransactionItem} item
 */
export function transactionNeedsBookingLabel(item) {
  if (!item || item.kind === 'payout' || item.source === 'payout' || item.tone === 'payout') {
    return false;
  }
  if (cleanService(item.serviceName)) {
    return false;
  }
  const fromTitle = splitPaymentsTransactionTitle(item.title, item.extraCount);
  if (fromTitle.primary) {
    return false;
  }
  return Boolean(item.bookingId || localBookingPaymentId(item.id));
}

/**
 * @param {import('../constants/paymentsTransactions').PaymentsTransactionItem[]} items
 * @returns {{ bookingIds: string[]; paymentIds: string[] }}
 */
export function bookingLabelLookupArgs(items) {
  const bookingIds = [];
  const paymentIds = [];
  for (const item of items ?? []) {
    if (!transactionNeedsBookingLabel(item)) continue;
    if (item.bookingId) bookingIds.push(item.bookingId);
    const paymentId = localBookingPaymentId(item.id);
    if (paymentId) paymentIds.push(paymentId);
  }
  return {
    bookingIds: [...new Set(bookingIds)],
    paymentIds: [...new Set(paymentIds)],
  };
}

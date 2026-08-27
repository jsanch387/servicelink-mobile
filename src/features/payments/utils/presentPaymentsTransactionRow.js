import {
  isGenericMultiJobTitle,
  splitPaymentsTransactionTitle,
  stripGenericMultiJobLabel,
} from './splitPaymentsTransactionTitle';
import { stripPaymentsCardDetails } from './stripPaymentsCardDetails';

function notableStatus(item) {
  const status = typeof item?.statusLabel === 'string' ? item.statusLabel.trim() : '';
  if (!status) return '';
  if (status.toLowerCase() === 'paid') return '';
  return status;
}

function isPayout(item) {
  return item?.kind === 'payout' || item?.source === 'payout' || item?.tone === 'payout';
}

function extraLabelFromCount(count) {
  const n = Math.max(0, Math.round(Number(count) || 0));
  return n > 0 ? `+${n} more` : '';
}

function cleanService(value) {
  const raw = stripGenericMultiJobLabel(value);
  if (!raw || isGenericMultiJobTitle(raw)) return '';
  const parts = raw
    .split(/\s+[—–-]\s+/u)
    .map((part) => part.trim())
    .filter(Boolean);
  const primary = parts[0] || '';
  return isGenericMultiJobTitle(primary) ? '' : primary;
}

const KNOWN_METHODS = /^(tap to pay|payment link|cash|card|payment app|other)$/i;
const PLACEHOLDER_NAME =
  /^(customer|guest|unknown|walk[\s-]?up|walk[\s-]?in|no name|unnamed|n\/a)$/i;

function cleanLine(value) {
  return stripGenericMultiJobLabel(stripPaymentsCardDetails(value));
}

function isMissingCustomerName(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return true;
  if (/^[·•\-—–.]+$/.test(raw)) return true;
  if (PLACEHOLDER_NAME.test(raw)) return true;
  if (KNOWN_METHODS.test(raw)) return true;
  if (isGenericMultiJobTitle(raw)) return true;
  return false;
}

function splitCustomerAndMethod(subtitle, methodField) {
  const cleaned = cleanLine(subtitle);
  const fromField = cleanLine(methodField);
  const parts = cleaned
    .split(/\s*·\s*/)
    .map((part) => part.trim())
    .filter((part) => part && !/^[·•\-—–.]+$/.test(part));
  const rawCustomer = parts.length >= 2 ? parts[0] : parts[0] || '';
  const rawMethod = parts.length >= 2 ? parts.slice(1).join(' · ') : '';
  const method = rawMethod || fromField || (KNOWN_METHODS.test(rawCustomer) ? rawCustomer : '');
  const customer = isMissingCustomerName(rawCustomer) ? '' : rawCustomer;
  return { customer, method: isGenericMultiJobTitle(method) ? '' : method };
}

function whoHowLine(customer, method, status) {
  if (customer && method) return `${customer} · ${method}`;
  if (customer) return customer;
  if (status && method) return `${status} · ${method}`;
  return method || status;
}

/**
 * Owner-facing row. Customer · how they paid on the left.
 *
 * @param {import('../constants/paymentsTransactions').PaymentsTransactionItem} item
 * @returns {{ primary: string; extraLabel: string; subtitle: string }}
 */
export function presentPaymentsTransactionRow(item) {
  const extraCount = Math.max(0, Math.round(Number(item?.extraCount) || 0));
  const fromTitle = splitPaymentsTransactionTitle(item?.title, extraCount);
  const extraLabel = extraLabelFromCount(extraCount) || fromTitle.extraLabel;

  if (isPayout(item)) {
    const title = stripGenericMultiJobLabel(item?.title);
    const primary =
      /^payouts?(\s+to your bank)?$/i.test(title) || !title
        ? 'Payout'
        : fromTitle.primary || 'Payout';
    return {
      primary,
      extraLabel: '',
      subtitle: notableStatus(item),
    };
  }

  const primary = fromTitle.primary || cleanService(item?.serviceName);
  const { customer, method } = splitCustomerAndMethod(item?.subtitle, item?.methodLabel);

  return {
    primary,
    extraLabel,
    subtitle: whoHowLine(customer, method, notableStatus(item)),
  };
}

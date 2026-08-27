import { PAYMENTS_TRANSACTIONS_PAGE_SIZE } from '../constants/paymentsTransactions';

function readString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function readTone(value) {
  if (value === 'out' || value === 'payout') {
    return value;
  }
  return 'in';
}

function readNonNegInt(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function readExtraCount(row) {
  if (row.extraCount != null) {
    return readNonNegInt(row.extraCount);
  }
  const jobs = readNonNegInt(row.jobCount);
  return jobs > 1 ? jobs - 1 : 0;
}

/**
 * @param {unknown} raw
 * @returns {import('../constants/paymentsTransactions').PaymentsTransactionItem | null}
 */
export function parsePaymentsTransactionItem(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const id = readString(/** @type {{ id?: unknown }} */ (raw).id);
  if (!id) {
    return null;
  }
  const row = /** @type {Record<string, unknown>} */ (raw);
  const feeLabel = readString(row.feeLabel);
  return {
    id,
    kind: readString(row.kind) || 'payment',
    tone: readTone(row.tone),
    title: readString(row.title),
    subtitle: readString(row.subtitle),
    amountLabel: readString(row.amountLabel),
    statusLabel: readString(row.statusLabel),
    dateLabel: readString(row.dateLabel),
    feeLabel: feeLabel || null,
    source: readString(row.source),
    methodLabel: readString(row.methodLabel),
    extraCount: readExtraCount(row),
    jobCount: readNonNegInt(row.jobCount),
    bookingId: readString(row.bookingId) || readString(row.booking_id),
    serviceName: readString(row.serviceName) || readString(row.service_name),
  };
}

/**
 * @param {unknown} raw
 * @returns {import('../constants/paymentsTransactions').PaymentsTransactionBalance}
 */
export function parsePaymentsTransactionBalance(raw) {
  const row = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {};
  return {
    availableCaption: readString(row.availableCaption) || 'Available',
    pendingCaption: readString(row.pendingCaption) || 'On the way',
    availableLabel: readString(row.availableLabel) || '$0.00',
    pendingLabel: readString(row.pendingLabel) || '$0.00',
  };
}

/**
 * @param {unknown} payload
 * @returns {import('../constants/paymentsTransactions').PaymentsTransactionsPage}
 */
export function parsePaymentsTransactionsPage(payload) {
  const body =
    payload && typeof payload === 'object' ? /** @type {Record<string, unknown>} */ (payload) : {};
  const items = Array.isArray(body.items)
    ? body.items.map(parsePaymentsTransactionItem).filter(Boolean)
    : [];
  const nextCursor = readString(body.nextCursor);
  return {
    currency: readString(body.currency) || 'usd',
    balance: parsePaymentsTransactionBalance(body.balance),
    items,
    hasMore: Boolean(body.hasMore),
    nextCursor: nextCursor || null,
  };
}

export function clampPaymentsTransactionsLimit(limit) {
  const n = Math.round(Number(limit));
  if (!Number.isFinite(n)) {
    return PAYMENTS_TRANSACTIONS_PAGE_SIZE;
  }
  return Math.min(50, Math.max(1, n));
}

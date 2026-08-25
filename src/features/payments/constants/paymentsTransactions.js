export const PAYMENTS_TRANSACTIONS_PAGE_SIZE = 20;

/** @typedef {'in' | 'out' | 'payout'} PaymentsTransactionTone */
/** @typedef {'payment' | 'refund' | 'payout'} PaymentsTransactionKind */

/**
 * @typedef {object} PaymentsTransactionBalance
 * @property {string} availableLabel
 * @property {string} pendingLabel
 * @property {string} availableCaption
 * @property {string} pendingCaption
 */

/**
 * @typedef {object} PaymentsTransactionItem
 * @property {string} id
 * @property {PaymentsTransactionKind | string} kind
 * @property {PaymentsTransactionTone} tone
 * @property {string} title
 * @property {string} subtitle
 * @property {string} amountLabel
 * @property {string} statusLabel
 * @property {string} dateLabel
 * @property {string | null} feeLabel
 * @property {string} source
 * @property {string} methodLabel
 * @property {number} extraCount
 * @property {number} jobCount
 * @property {string} bookingId
 * @property {string} serviceName
 */

/**
 * @typedef {object} PaymentsTransactionsPage
 * @property {string} currency
 * @property {PaymentsTransactionBalance} balance
 * @property {PaymentsTransactionItem[]} items
 * @property {boolean} hasMore
 * @property {string | null} nextCursor
 */

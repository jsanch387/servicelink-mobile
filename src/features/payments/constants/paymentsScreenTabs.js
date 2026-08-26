/** Top-level Payments screen tabs. */
export const PAYMENTS_SCREEN_TAB = Object.freeze({
  REVENUE: 'revenue',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'settings',
});

/** Revenue first; settings last. */
export const PAYMENTS_SCREEN_TAB_OPTIONS = Object.freeze([
  { id: PAYMENTS_SCREEN_TAB.REVENUE, label: 'Revenue' },
  { id: PAYMENTS_SCREEN_TAB.TRANSACTIONS, label: 'Transactions' },
  { id: PAYMENTS_SCREEN_TAB.SETTINGS, label: 'Settings' },
]);

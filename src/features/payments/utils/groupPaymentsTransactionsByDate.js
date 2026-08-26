/**
 * Consecutive items that share a painted `dateLabel` stay in one group.
 * Does not parse dates — only groups the server string.
 *
 * @param {import('../constants/paymentsTransactions').PaymentsTransactionItem[]} items
 * @returns {{ dateLabel: string; items: import('../constants/paymentsTransactions').PaymentsTransactionItem[] }[]}
 */
export function groupPaymentsTransactionsByDate(items) {
  const groups = [];
  for (const item of items) {
    const dateLabel = typeof item.dateLabel === 'string' ? item.dateLabel : '';
    const last = groups[groups.length - 1];
    if (last && last.dateLabel === dateLabel) {
      last.items.push(item);
    } else {
      groups.push({ dateLabel, items: [item] });
    }
  }
  return groups;
}

/**
 * Groups approved quote cards by latest activity month, preserving newest-first order.
 *
 * Quotes currently do not expose an immutable approval timestamp, so `activityAt`
 * uses the list's `updated_at` value.
 *
 * @param {Array<{ activityAt?: string | null }>} cards
 * @returns {Array<{ key: string; label: string; cards: Array<object> }>}
 */
export function groupApprovedQuotesByMonth(cards) {
  const groups = [];
  const groupByKey = new Map();

  for (const card of cards) {
    const date = new Date(card.activityAt ?? '');
    const hasValidDate = Number.isFinite(date.getTime());
    const key = hasValidDate
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      : 'older';
    const label = hasValidDate
      ? date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      : 'older quotes';

    let group = groupByKey.get(key);
    if (!group) {
      group = { key, label, cards: [] };
      groupByKey.set(key, group);
      groups.push(group);
    }
    group.cards.push(card);
  }

  return groups;
}

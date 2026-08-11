import { MOCK_SUBSCRIPTIONS } from '../mock/mockSubscriptions';

/**
 * Design-preview lookup: mock subscription rows keyed by `customerId`.
 * Prefers a live membership (active / past due) over canceled.
 *
 * @param {string | null | undefined} customerId
 * @returns {import('../mock/mockSubscriptions').MockSubscription | null}
 */
export function findMockSubscriptionForCustomer(customerId) {
  const id = String(customerId ?? '').trim();
  if (!id) return null;
  const rows = MOCK_SUBSCRIPTIONS.filter((row) => row.customerId === id);
  if (rows.length === 0) return null;
  return (
    rows.find((row) => row.status === 'active') ??
    rows.find((row) => row.status === 'past_due') ??
    rows[0] ??
    null
  );
}

/** Mock CRM ids used by subscription design previews. */
export function isMockSubscriptionCustomerId(customerId) {
  return String(customerId ?? '')
    .trim()
    .startsWith('cust_mock_');
}

import { MOCK_SUBSCRIPTIONS } from '../mock/mockSubscriptions';

/**
 * Active / past-due subscribers on a plan (mock). Canceled are omitted from plan detail.
 *
 * @param {{ id?: string } | null | undefined} plan
 * @returns {import('../mock/mockSubscriptions').MockSubscription[]}
 */
export function getMockPlanSubscribers(plan) {
  const planId = String(plan?.id ?? '').trim();
  if (!planId) return [];

  return MOCK_SUBSCRIPTIONS.filter((row) => row.planId === planId && row.status !== 'canceled');
}

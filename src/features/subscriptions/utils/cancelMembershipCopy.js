/**
 * Owner toast after canceling a customer membership.
 *
 * @param {{
 *   alreadyCanceled?: boolean;
 *   action?: 'cancel_at_period_end' | 'cancel_now';
 * }} args
 */
export function getCancelMembershipToastMessage({ alreadyCanceled = false, action } = {}) {
  if (alreadyCanceled) return 'Subscription already canceled — status updated';
  if (action === 'cancel_now') return 'Subscription canceled';
  return 'Cancels at period end';
}

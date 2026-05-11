import { queryClient } from '../../../lib/queryClient';
import { accountSettingsQueryKey } from '../../more/queryKeys';

/** Profile columns used by `hasProAccessFromProfile` / account settings bundle. */
const TRIAL_MERGE_KEYS = [
  'subscription_tier',
  'subscription_status',
  'stripe_customer_id',
  'stripe_subscription_id',
  'subscription_current_period_end',
  'subscription_cancel_at_period_end',
];

/**
 * Merges API `trial_confirmation` into the account-settings React Query cache so
 * `SubscriptionContext` sees Pro/trial access immediately and after a refetch that
 * still returns stale Supabase rows (webhook lag).
 *
 * @param {string} userId
 * @param {Record<string, unknown> | null | undefined} trialConfirmation
 */
export function applyTrialConfirmationToAccountSettingsCache(userId, trialConfirmation) {
  if (!userId || !trialConfirmation || typeof trialConfirmation !== 'object') {
    return;
  }

  const key = accountSettingsQueryKey(userId);
  const prev = queryClient.getQueryData(key);
  const prevOwner =
    prev?.ownerProfile && typeof prev.ownerProfile === 'object' ? { ...prev.ownerProfile } : {};
  const prevBusiness = prev?.business ?? null;

  const merged = { ...prevOwner };
  for (const field of TRIAL_MERGE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(trialConfirmation, field)) {
      continue;
    }
    const v = trialConfirmation[field];
    if (v !== undefined && v !== null && v !== '') {
      merged[field] = v;
    }
  }

  queryClient.setQueryData(key, { ownerProfile: merged, business: prevBusiness });
}

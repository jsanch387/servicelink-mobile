import { queryClient } from '../../../lib/queryClient';
import { accountSettingsQueryKey } from '../../more/queryKeys';
import { hasProAccessFromProfile } from '../../more/utils/subscriptionPresentation';
import { applyTrialConfirmationToAccountSettingsCache } from './applyTrialConfirmationToAccountSettingsCache';
import { applyTrialConfirmationToOnboardingCache } from './applyTrialConfirmationToOnboardingCache';

const ONBOARDING_PROFILE_KEY = (userId) => ['profiles-onboarding', userId];

/**
 * Refetch account bundle from Supabase; if subscription rows are still stale (webhook lag)
 * but we have authoritative `trial_confirmation`, merge it again so the upgrade paywall
 * does not flash after onboarding activation.
 *
 * @param {string} userId
 * @param {Record<string, unknown> | null | undefined} trialConfirmation
 */
async function refreshAccountSettingsAfterTrial(userId, trialConfirmation) {
  if (trialConfirmation && typeof trialConfirmation === 'object') {
    applyTrialConfirmationToAccountSettingsCache(userId, trialConfirmation);
  }
  await queryClient.invalidateQueries({ queryKey: accountSettingsQueryKey(userId) });
  await queryClient.refetchQueries({ queryKey: accountSettingsQueryKey(userId) });
  if (trialConfirmation && typeof trialConfirmation === 'object') {
    const bundle = queryClient.getQueryData(accountSettingsQueryKey(userId));
    if (bundle?.ownerProfile && !hasProAccessFromProfile(bundle.ownerProfile)) {
      applyTrialConfirmationToAccountSettingsCache(userId, trialConfirmation);
    }
  }
}

/**
 * After trial activation (silent API, confirm-after-checkout, etc.), merge optional
 * `trial_confirmation` into cache, then refetch Supabase `profiles` until
 * `onboarding_status === 'completed'` or attempts are exhausted.
 *
 * @param {{ userId: string; trial_confirmation?: Record<string, unknown> | null; maxAttempts?: number; delayMs?: number }} params
 * @returns {Promise<{ completed: boolean }>}
 */
export async function refetchOnboardingAfterStripe({
  userId,
  trial_confirmation: trialConfirmation,
  maxAttempts = 6,
  delayMs = 1200,
}) {
  if (!userId) {
    return { completed: false };
  }

  if (trialConfirmation && typeof trialConfirmation === 'object') {
    // Merge subscription first so `SubscriptionContext` shows access before the gate
    // flips `needsOnboarding` off (avoids one-frame full-screen paywall).
    applyTrialConfirmationToAccountSettingsCache(userId, trialConfirmation);
    applyTrialConfirmationToOnboardingCache(userId, trialConfirmation);
    const data = queryClient.getQueryData(ONBOARDING_PROFILE_KEY(userId));
    if (data?.onboarding_status === 'completed') {
      await refreshAccountSettingsAfterTrial(userId, trialConfirmation);
      return { completed: true };
    }
  }

  let completed = false;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await queryClient.refetchQueries({ queryKey: ONBOARDING_PROFILE_KEY(userId) });
    const data = queryClient.getQueryData(ONBOARDING_PROFILE_KEY(userId));
    if (data?.onboarding_status === 'completed') {
      completed = true;
      break;
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  await refreshAccountSettingsAfterTrial(userId, trialConfirmation);
  return { completed };
}

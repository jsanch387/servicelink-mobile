import { queryClient } from '../../../lib/queryClient';

const ONBOARDING_PROFILE_KEY = (userId) => ['profiles-onboarding', userId];

/**
 * Merges server `trial_confirmation` into the React Query cache used by onboarding gate
 * so the UI can advance without waiting on the next Supabase round-trip.
 *
 * @param {string} userId
 * @param {Record<string, unknown> | null | undefined} trialConfirmation
 */
export function applyTrialConfirmationToOnboardingCache(userId, trialConfirmation) {
  if (!userId || !trialConfirmation || typeof trialConfirmation !== 'object') {
    return;
  }
  const raw = trialConfirmation.onboarding_status;
  const status = typeof raw === 'string' && raw.trim() ? String(raw).trim() : null;
  if (!status) {
    return;
  }
  const key = ONBOARDING_PROFILE_KEY(userId);
  const prev = queryClient.getQueryData(key);
  const prevStep =
    prev && typeof prev.onboarding_step === 'number' && Number.isFinite(prev.onboarding_step)
      ? prev.onboarding_step
      : 5;
  queryClient.setQueryData(key, {
    onboarding_status: status,
    onboarding_step: status === 'completed' ? 5 : prevStep,
  });
}

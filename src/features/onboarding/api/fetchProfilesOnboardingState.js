import { supabase } from '../../../lib/supabase';

function clampOnboardingStep(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.min(5, Math.floor(n));
}

/**
 * Reads onboarding fields from `profiles` (same source as web `getOnboardingState`).
 * @param {string} userId
 * @returns {Promise<{ onboarding_status: string; onboarding_step: number }>}
 */
export async function fetchProfilesOnboardingState(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_status, onboarding_step')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? 'Could not load onboarding state');
  }

  const onboarding_status =
    typeof data?.onboarding_status === 'string' && data.onboarding_status.trim()
      ? data.onboarding_status.trim()
      : 'not_started';

  return {
    onboarding_status,
    onboarding_step: clampOnboardingStep(data?.onboarding_step),
  };
}

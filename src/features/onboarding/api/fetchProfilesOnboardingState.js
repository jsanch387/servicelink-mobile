import { supabase } from '../../../lib/supabase';
import { shouldStampNewOnboardingFlow } from '../utils/onboardingFlow';
import { stampAppOnboardingForNewProfile } from './stampAppOnboarding';

function clampOnboardingStep(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.min(5, Math.floor(n));
}

/**
 * @param {unknown} value
 * @returns {'v2' | 'v3' | null}
 */
function readOnboardingFlow(value) {
  if (value === 'v2' || value === 'v3') return value;
  return null;
}

/**
 * Reads onboarding fields from `profiles` (same source as web `getOnboardingState`).
 * A not-yet-started account is stamped onto the 2-step setup.
 *
 * @param {string} userId
 * @returns {Promise<{ onboarding_status: string; onboarding_step: number; onboarding_flow: 'v2' | 'v3' | null }>}
 */
export async function fetchProfilesOnboardingState(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_status, onboarding_step, onboarding_flow')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? 'Could not load onboarding state');
  }

  const onboarding_status =
    typeof data?.onboarding_status === 'string' && data.onboarding_status.trim()
      ? data.onboarding_status.trim()
      : 'not_started';
  let onboarding_flow = readOnboardingFlow(data?.onboarding_flow);

  if (shouldStampNewOnboardingFlow({ onboarding_status, onboarding_flow })) {
    await stampAppOnboardingForNewProfile(userId);
    onboarding_flow = 'v3';
  }

  return {
    onboarding_status,
    onboarding_step: clampOnboardingStep(data?.onboarding_step),
    onboarding_flow,
  };
}

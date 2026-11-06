import { Platform } from 'react-native';
import { supabase } from '../../../lib/supabase';

function appSignupPlatform() {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  return null;
}

/**
 * Marks a not-yet-started account for the 2-step setup.
 * Leaves an existing `onboarding_flow` or `signup_platform` alone, including a website signup.
 *
 * @param {string} userId
 */
export async function stampAppOnboardingForNewProfile(userId) {
  const { error: flowError } = await supabase
    .from('profiles')
    .update({ onboarding_flow: 'v3' })
    .eq('user_id', userId)
    .eq('onboarding_status', 'not_started')
    .is('onboarding_flow', null);

  if (flowError) {
    throw new Error(flowError.message ?? 'Could not start setup');
  }

  const platform = appSignupPlatform();
  if (!platform) return;

  const { error: platformError } = await supabase
    .from('profiles')
    .update({ signup_platform: platform })
    .eq('user_id', userId)
    .eq('onboarding_status', 'not_started')
    .is('signup_platform', null);

  if (platformError) {
    throw new Error(platformError.message ?? 'Could not start setup');
  }
}

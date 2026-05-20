import { queryClient } from '../../../lib/queryClient';
import { accountSettingsQueryKey } from '../../more/queryKeys';

const ONBOARDING_PROFILE_KEY = (userId) => ['profiles-onboarding', userId];

/**
 * After step 5 completes onboarding on the server, poll Supabase `profiles` until
 * `onboarding_status === 'completed'` and refresh the account bundle.
 *
 * @param {{ userId: string; maxAttempts?: number; delayMs?: number }} params
 * @returns {Promise<{ completed: boolean }>}
 */
export async function refetchOnboardingAfterActivation({
  userId,
  maxAttempts = 6,
  delayMs = 1200,
}) {
  if (!userId) {
    return { completed: false };
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

  await queryClient.invalidateQueries({ queryKey: accountSettingsQueryKey(userId) });
  await queryClient.refetchQueries({ queryKey: accountSettingsQueryKey(userId) });

  return { completed };
}

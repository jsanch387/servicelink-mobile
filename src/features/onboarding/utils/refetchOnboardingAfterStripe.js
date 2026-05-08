import { queryClient } from '../../../lib/queryClient';
import { accountSettingsQueryKey } from '../../more/queryKeys';

const ONBOARDING_PROFILE_KEY = (userId) => ['profiles-onboarding', userId];

/**
 * Webhook may lag briefly after Checkout; refetch a few times until onboarding shows completed
 * (or attempts exhausted), then refresh account settings.
 *
 * @param {{ userId: string; maxAttempts?: number; delayMs?: number }} params
 */
export async function refetchOnboardingAfterStripe({ userId, maxAttempts = 6, delayMs = 1200 }) {
  if (!userId) {
    return;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await queryClient.refetchQueries({ queryKey: ONBOARDING_PROFILE_KEY(userId) });
    const data = queryClient.getQueryData(ONBOARDING_PROFILE_KEY(userId));
    if (data?.onboarding_status === 'completed') {
      break;
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  await queryClient.invalidateQueries({ queryKey: accountSettingsQueryKey(userId) });
}

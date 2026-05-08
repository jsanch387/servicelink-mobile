import { queryClient } from '../../../lib/queryClient';
import { HOME_QUERY_KEY } from '../../home/queryKeys';
import { accountSettingsQueryKey } from '../queryKeys';

/**
 * Stripe webhook updates may lag briefly; refresh account/home data a few times.
 *
 * @param {{ userId: string; maxAttempts?: number; delayMs?: number }} params
 */
export async function refetchAccountAfterPortal({ userId, maxAttempts = 4, delayMs = 1200 }) {
  if (!userId) {
    return;
  }

  for (let i = 0; i < maxAttempts; i++) {
    await queryClient.refetchQueries({ queryKey: accountSettingsQueryKey(userId) });
    if (i < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  await queryClient.invalidateQueries({ queryKey: HOME_QUERY_KEY });
}

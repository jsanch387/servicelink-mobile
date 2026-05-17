import { queryClient } from '../../../lib/queryClient';
import { HOME_QUERY_KEY } from '../../home/queryKeys';
import { accountSettingsQueryKey } from '../../more/queryKeys';
import { hasProAccessFromProfile } from '../../more/utils/subscriptionPresentation';

/**
 * After mobile upgrade Checkout, Stripe webhooks can lag before `profiles` shows Pro.
 * Poll the account bundle until `hasProAccess` or attempts are exhausted, then refresh home.
 *
 * @param {{ userId: string; maxAttempts?: number; delayMs?: number }} params
 * @returns {Promise<{ hasProAccess: boolean }>}
 */
export async function refetchAccountAfterUpgradeCheckout({
  userId,
  maxAttempts = 8,
  delayMs = 1000,
}) {
  if (!userId) {
    return { hasProAccess: false };
  }

  let hasProAccess = false;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await queryClient.refetchQueries({ queryKey: accountSettingsQueryKey(userId) });
    const bundle = queryClient.getQueryData(accountSettingsQueryKey(userId));
    if (hasProAccessFromProfile(bundle?.ownerProfile)) {
      hasProAccess = true;
      break;
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
  }

  await queryClient.invalidateQueries({ queryKey: HOME_QUERY_KEY });
  return { hasProAccess };
}

import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { useShopAccess } from '../../shop';
import { useSubscription } from '../../subscription';
import { CUSTOMER_SMS_ENABLED } from '../constants/customerSmsFlags';
import { resolveCustomerSmsAccess } from '../utils/resolveCustomerSmsAccess';

/**
 * Runtime SMS access for this signed-in shop user (kill switch + early access).
 * Team members inherit the shop path — not gated on their own Pro flag.
 */
export function useCustomerSmsAccess() {
  const { user } = useAuth();
  const { isOwnerProfileLoaded } = useSubscription();
  const { isShopLoading, shop } = useShopAccess();
  const shopReady = !isShopLoading && Boolean(shop?.id);

  return useMemo(
    () =>
      resolveCustomerSmsAccess({
        enabled: CUSTOMER_SMS_ENABLED,
        email: user?.email ?? null,
        profileLoaded: isOwnerProfileLoaded || shopReady,
      }),
    [isOwnerProfileLoaded, shopReady, user?.email],
  );
}

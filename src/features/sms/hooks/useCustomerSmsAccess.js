import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { useSubscription } from '../../subscription';
import { CUSTOMER_SMS_ENABLED } from '../constants/customerSmsFlags';
import { resolveCustomerSmsAccess } from '../utils/resolveCustomerSmsAccess';

/**
 * Runtime SMS access for this signed-in owner (kill switch + early access + Pro).
 */
export function useCustomerSmsAccess() {
  const { user } = useAuth();
  const { hasProAccess, isOwnerProfileLoaded } = useSubscription();

  return useMemo(
    () =>
      resolveCustomerSmsAccess({
        enabled: CUSTOMER_SMS_ENABLED,
        hasProAccess,
        email: user?.email ?? null,
        profileLoaded: isOwnerProfileLoaded,
      }),
    [hasProAccess, isOwnerProfileLoaded, user?.email],
  );
}

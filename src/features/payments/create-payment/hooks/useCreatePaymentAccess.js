import { useMemo } from 'react';
import { useAuth } from '../../../auth';
import { useSubscription } from '../../../subscription';
import { CREATE_PAYMENT_FEATURE_ENABLED } from '../constants/createPaymentFeatureFlags';
import { resolveCreatePaymentAccess } from '../utils/resolveCreatePaymentAccess';

/**
 * Runtime Create payment rollout for this signed-in owner.
 */
export function useCreatePaymentAccess() {
  const { user } = useAuth();
  const { hasProAccess, isOwnerProfileLoaded } = useSubscription();

  return useMemo(
    () =>
      resolveCreatePaymentAccess({
        enabled: CREATE_PAYMENT_FEATURE_ENABLED,
        hasProAccess,
        email: user?.email ?? null,
        profileLoaded: isOwnerProfileLoaded,
      }),
    [hasProAccess, isOwnerProfileLoaded, user?.email],
  );
}

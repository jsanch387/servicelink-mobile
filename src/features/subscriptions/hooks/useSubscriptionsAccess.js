import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { useSubscription } from '../../subscription';
import { SUBSCRIPTIONS_FEATURE_ENABLED } from '../constants/subscriptionsFeatureFlags';
import { resolveSubscriptionsAccess } from '../utils/resolveSubscriptionsAccess';

/**
 * Runtime subscriptions access for this signed-in owner (kill switch + early access + Pro).
 */
export function useSubscriptionsAccess() {
  const { user } = useAuth();
  const { hasProAccess, isOwnerProfileLoaded } = useSubscription();

  return useMemo(
    () =>
      resolveSubscriptionsAccess({
        enabled: SUBSCRIPTIONS_FEATURE_ENABLED,
        hasProAccess,
        email: user?.email ?? null,
        profileLoaded: isOwnerProfileLoaded,
      }),
    [hasProAccess, isOwnerProfileLoaded, user?.email],
  );
}

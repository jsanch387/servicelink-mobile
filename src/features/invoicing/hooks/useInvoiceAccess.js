import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { useShopAccess } from '../../shop';
import { useSubscription } from '../../subscription';
import { resolveInvoiceAccess } from '../utils/resolveInvoiceAccess';

/** Office owners see Invoices. Pro uses the list; others get the subscribe card. */
export function useInvoiceAccess() {
  const { user } = useAuth();
  const { canSeeOffice, isShopLoading } = useShopAccess();
  const { hasProAccess, isOwnerProfileLoaded, isLoading: subscriptionLoading } = useSubscription();
  const profileLoaded = isOwnerProfileLoaded && !isShopLoading && !subscriptionLoading;

  return useMemo(
    () =>
      resolveInvoiceAccess({
        email: user?.email ?? null,
        canSeeOffice,
        hasProAccess,
        profileLoaded,
      }),
    [canSeeOffice, hasProAccess, profileLoaded, user?.email],
  );
}

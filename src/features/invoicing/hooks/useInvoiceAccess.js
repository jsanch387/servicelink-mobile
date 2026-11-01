import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { useShopAccess } from '../../shop';
import { canUseShopTools } from '../../shop/utils/canUseShopTools';
import { useSubscription } from '../../subscription';
import { resolveInvoiceAccess } from '../utils/resolveInvoiceAccess';

/** Office logins see Invoices. Pro owners and managers use the list; other owners get the subscribe card. */
export function useInvoiceAccess() {
  const { user } = useAuth();
  const { canSeeOffice, isMember, isShopLoading } = useShopAccess();
  const { hasProAccess, isOwnerProfileLoaded, isLoading: subscriptionLoading } = useSubscription();
  const profileLoaded = isOwnerProfileLoaded && !isShopLoading && !subscriptionLoading;
  const hasShopTools = canUseShopTools({ hasProAccess, isMember, canSeeOffice });

  return useMemo(
    () =>
      resolveInvoiceAccess({
        email: user?.email ?? null,
        canSeeOffice,
        hasProAccess: hasShopTools,
        profileLoaded,
      }),
    [canSeeOffice, hasShopTools, profileLoaded, user?.email],
  );
}

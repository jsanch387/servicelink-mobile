import { useMemo } from 'react';
import { useShopAccess } from '../../shop';
import { canUseShopTools } from '../../shop/utils/canUseShopTools';
import { useSubscription } from '../../subscription';
import { resolveExpenseAccess } from '../utils/resolveExpenseAccess';

/** Office logins see Expenses. Pro owners and managers use the list; other owners get the subscribe card. */
export function useExpenseAccess() {
  const { canSeeOffice, isMember, isShopLoading } = useShopAccess();
  const { hasProAccess, isOwnerProfileLoaded, isLoading: subscriptionLoading } = useSubscription();
  const profileLoaded = isOwnerProfileLoaded && !isShopLoading && !subscriptionLoading;
  const hasShopTools = canUseShopTools({ hasProAccess, isMember, canSeeOffice });

  return useMemo(
    () =>
      resolveExpenseAccess({
        canSeeOffice,
        hasProAccess: hasShopTools,
        profileLoaded,
      }),
    [canSeeOffice, hasShopTools, profileLoaded],
  );
}

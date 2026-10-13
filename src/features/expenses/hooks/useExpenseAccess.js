import { useMemo } from 'react';
import { useShopAccess } from '../../shop';
import { useSubscription } from '../../subscription';
import { resolveExpenseAccess } from '../utils/resolveExpenseAccess';

/** Office owners see Expenses. Pro uses the list; others get the subscribe card. */
export function useExpenseAccess() {
  const { canSeeOffice, isShopLoading } = useShopAccess();
  const { hasProAccess, isOwnerProfileLoaded, isLoading: subscriptionLoading } = useSubscription();
  const profileLoaded = isOwnerProfileLoaded && !isShopLoading && !subscriptionLoading;

  return useMemo(
    () =>
      resolveExpenseAccess({
        canSeeOffice,
        hasProAccess,
        profileLoaded,
      }),
    [canSeeOffice, hasProAccess, profileLoaded],
  );
}

import { useSubscription } from '../../subscription';
import { canUseShopTools } from '../utils/canUseShopTools';
import { useShopAccess } from './useShopAccess';

/** Plan access for office tools. A manager uses the shop's tools without a personal Pro plan. */
export function useShopToolAccess() {
  const { hasProAccess, isOwnerProfileLoaded } = useSubscription();
  const { canSeeOffice, isMember } = useShopAccess();

  return {
    canUseShopTools: canUseShopTools({ hasProAccess, isMember, canSeeOffice }),
    isOwnerProfileLoaded,
  };
}

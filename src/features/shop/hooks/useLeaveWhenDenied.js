import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { useShopAccess } from './useShopAccess';

/** Leaves the screen once the shop query has settled and this login is not allowed. */
export function useLeaveWhenDenied(allowed) {
  const navigation = useNavigation();
  const { isShopLoading } = useShopAccess();

  useEffect(() => {
    if (isShopLoading || allowed) return;
    if (navigation.canGoBack?.()) {
      navigation.goBack();
    }
  }, [allowed, isShopLoading, navigation]);
}

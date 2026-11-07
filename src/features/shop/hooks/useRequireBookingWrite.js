import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { useShopAccess } from './useShopAccess';

/** Leaves a calendar-write screen when this login does not have `bookings.write`. */
export function useRequireBookingWrite() {
  const navigation = useNavigation();
  const { canWriteBookings, isShopLoading } = useShopAccess();

  useEffect(() => {
    if (isShopLoading || canWriteBookings) return;
    if (navigation.canGoBack?.()) {
      navigation.goBack();
    }
  }, [canWriteBookings, isShopLoading, navigation]);
}

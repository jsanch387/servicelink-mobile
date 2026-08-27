import AsyncStorage from '@react-native-async-storage/async-storage';

export const BOOKING_ACTIONS_MOVED_TIP_SEEN_KEY = 'servicelink.bookingDetails.actionsMovedTipSeen';

export async function hasSeenBookingActionsMovedTip() {
  try {
    const value = await AsyncStorage.getItem(BOOKING_ACTIONS_MOVED_TIP_SEEN_KEY);
    return value === '1';
  } catch {
    return false;
  }
}

export async function markBookingActionsMovedTipSeen() {
  try {
    await AsyncStorage.setItem(BOOKING_ACTIONS_MOVED_TIP_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

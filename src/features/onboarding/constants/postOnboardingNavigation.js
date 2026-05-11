import AsyncStorage from '@react-native-async-storage/async-storage';

/** AsyncStorage: set when onboarding completes so main tabs open on Booking link once. */
export const PENDING_NAVIGATE_TO_BOOKING_LINK_KEY = 'servicelink.pendingNavigateToBookingLink';

/** Call right after activation succeeds, before profile refetch (avoids race with MainTab mount). */
export async function setPendingNavigateToBookingLink() {
  try {
    await AsyncStorage.setItem(PENDING_NAVIGATE_TO_BOOKING_LINK_KEY, '1');
  } catch {
    /* ignore */
  }
}

export async function clearPendingBookingLinkNavigation() {
  try {
    await AsyncStorage.removeItem(PENDING_NAVIGATE_TO_BOOKING_LINK_KEY);
  } catch {
    /* ignore */
  }
}

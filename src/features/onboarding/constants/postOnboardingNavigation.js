import AsyncStorage from '@react-native-async-storage/async-storage';

/** AsyncStorage: set when onboarding completes; `AuthNavigator` consumes it once main tabs are interactive. */
export const PENDING_NAVIGATE_TO_BOOKING_LINK_KEY = 'servicelink.pendingNavigateToBookingLink';

/** Call right after activation succeeds, before profile refetch (avoids race with tab mount / subscription boot). */
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

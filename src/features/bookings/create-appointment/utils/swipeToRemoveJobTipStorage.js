import AsyncStorage from '@react-native-async-storage/async-storage';

export const SWIPE_TO_REMOVE_JOB_TIP_SEEN_KEY =
  'servicelink.createAppointment.swipeToRemoveJobTipSeen';

export async function hasSeenSwipeToRemoveJobTip() {
  try {
    const value = await AsyncStorage.getItem(SWIPE_TO_REMOVE_JOB_TIP_SEEN_KEY);
    return value === '1';
  } catch {
    return false;
  }
}

export async function markSwipeToRemoveJobTipSeen() {
  try {
    await AsyncStorage.setItem(SWIPE_TO_REMOVE_JOB_TIP_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

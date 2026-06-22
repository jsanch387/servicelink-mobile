import AsyncStorage from '@react-native-async-storage/async-storage';

export const TAP_TO_PAY_EDUCATION_SEEN_KEY = 'servicelink.tapToPayEducationSeen';

export async function hasSeenTapToPayEducation() {
  try {
    const value = await AsyncStorage.getItem(TAP_TO_PAY_EDUCATION_SEEN_KEY);
    return value === '1';
  } catch {
    return false;
  }
}

export async function markTapToPayEducationSeen() {
  try {
    await AsyncStorage.setItem(TAP_TO_PAY_EDUCATION_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

export async function clearTapToPayEducationSeen() {
  try {
    await AsyncStorage.removeItem(TAP_TO_PAY_EDUCATION_SEEN_KEY);
  } catch {
    /* ignore */
  }
}

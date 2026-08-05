import AsyncStorage from '@react-native-async-storage/async-storage';

export const NEXT_UP_ON_MY_WAY_TRY_IT_SEEN_KEY = 'servicelink.nextUp.onMyWayTryItSeen';

export async function readOnMyWayTryItSeen() {
  try {
    const raw = await AsyncStorage.getItem(NEXT_UP_ON_MY_WAY_TRY_IT_SEEN_KEY);
    return raw === '1' || raw === 'true';
  } catch {
    return false;
  }
}

export async function markOnMyWayTryItSeen() {
  try {
    await AsyncStorage.setItem(NEXT_UP_ON_MY_WAY_TRY_IT_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

export async function clearOnMyWayTryItSeen() {
  try {
    await AsyncStorage.removeItem(NEXT_UP_ON_MY_WAY_TRY_IT_SEEN_KEY);
  } catch {
    /* ignore */
  }
}

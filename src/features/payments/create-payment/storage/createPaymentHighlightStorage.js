import AsyncStorage from '@react-native-async-storage/async-storage';

export const CREATE_PAYMENT_HIGHLIGHT_SEEN_KEY = 'servicelink.createPayment.fabHighlightSeen';

export async function readCreatePaymentHighlightSeen() {
  try {
    const raw = await AsyncStorage.getItem(CREATE_PAYMENT_HIGHLIGHT_SEEN_KEY);
    return raw === '1' || raw === 'true';
  } catch {
    return false;
  }
}

export async function markCreatePaymentHighlightSeen() {
  try {
    await AsyncStorage.setItem(CREATE_PAYMENT_HIGHLIGHT_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

export async function clearCreatePaymentHighlightSeen() {
  try {
    await AsyncStorage.removeItem(CREATE_PAYMENT_HIGHLIGHT_SEEN_KEY);
  } catch {
    /* ignore */
  }
}

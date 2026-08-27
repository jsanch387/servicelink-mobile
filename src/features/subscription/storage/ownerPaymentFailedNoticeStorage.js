import AsyncStorage from '@react-native-async-storage/async-storage';

export const OWNER_PAYMENT_FAILED_NOTICE_DISMISSED_KEY =
  'servicelink.subscription.paymentFailedNoticeDismissed';

/** @param {unknown} raw */
export function parseDismissedOwnerPaymentFailedKeys(raw) {
  if (raw == null || raw === '') {
    return [];
  }
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry) => typeof entry === 'string' && entry.trim() !== '');
  } catch {
    return [];
  }
}

export async function readDismissedOwnerPaymentFailedKeys() {
  try {
    const raw = await AsyncStorage.getItem(OWNER_PAYMENT_FAILED_NOTICE_DISMISSED_KEY);
    return parseDismissedOwnerPaymentFailedKeys(raw);
  } catch {
    return [];
  }
}

/** @param {string[]} keys */
export async function writeDismissedOwnerPaymentFailedKeys(keys) {
  try {
    await AsyncStorage.setItem(OWNER_PAYMENT_FAILED_NOTICE_DISMISSED_KEY, JSON.stringify(keys));
  } catch {
    /* ignore */
  }
}

/** @param {string} key */
export async function markOwnerPaymentFailedNoticeDismissed(key) {
  const trimmed = String(key ?? '').trim();
  if (!trimmed) {
    return;
  }
  const current = await readDismissedOwnerPaymentFailedKeys();
  if (current.includes(trimmed)) {
    return;
  }
  await writeDismissedOwnerPaymentFailedKeys([...current, trimmed]);
}

export async function clearDismissedOwnerPaymentFailedNotices() {
  try {
    await AsyncStorage.removeItem(OWNER_PAYMENT_FAILED_NOTICE_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

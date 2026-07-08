import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'booking-checkout-snapshot:';

function storageKey(bookingId) {
  return `${KEY_PREFIX}${String(bookingId ?? '').trim()}`;
}

/**
 * @param {string} bookingId
 * @returns {Promise<import('./buildJobCompletedPayload').CompleteVisitCheckoutState | null>}
 */
export async function getBookingCheckoutSnapshot(bookingId) {
  const id = String(bookingId ?? '').trim();
  if (!id) {
    return null;
  }
  try {
    const raw = await AsyncStorage.getItem(storageKey(id));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} bookingId
 * @param {import('./buildJobCompletedPayload').CompleteVisitCheckoutState} checkout
 */
export async function saveBookingCheckoutSnapshot(bookingId, checkout) {
  const id = String(bookingId ?? '').trim();
  if (!id || !checkout) {
    return;
  }
  try {
    await AsyncStorage.setItem(storageKey(id), JSON.stringify(checkout));
  } catch {
    // Best-effort — UI still uses React Query cache when available.
  }
}

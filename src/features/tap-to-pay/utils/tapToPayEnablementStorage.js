import AsyncStorage from '@react-native-async-storage/async-storage';
import { logTapToPayDebug, maskId } from './logTapToPayDebug';

const TAP_TO_PAY_MERCHANT_ENABLED_KEY = 'servicelink.tapToPayMerchantEnabled';

/**
 * @param {string | null | undefined} stripeAccountId
 * @param {string | null | undefined} terminalLocationId
 */
export function buildTapToPayMerchantEnablementKey(stripeAccountId, terminalLocationId) {
  const account = stripeAccountId?.trim() ?? '';
  const location = terminalLocationId?.trim() ?? '';
  if (!account || !location) {
    return null;
  }
  return `${account}|${location}`;
}

/**
 * Merchant opted in on Payments (or completed a successful connect). Not Apple T&C storage —
 * only gates background warm-up until the merchant explicitly enables on this device.
 *
 * @param {string | null | undefined} stripeAccountId
 * @param {string | null | undefined} terminalLocationId
 */
export async function isTapToPayMerchantEnabled(stripeAccountId, terminalLocationId) {
  const key = buildTapToPayMerchantEnablementKey(stripeAccountId, terminalLocationId);
  if (!key) {
    logTapToPayDebug('enablement.storage.check', {
      storageKey: TAP_TO_PAY_MERCHANT_ENABLED_KEY,
      expectedMerchantKey: '(missing account or location id)',
      storedMerchantKey: '(not read)',
      match: false,
    });
    return false;
  }
  try {
    const stored = await AsyncStorage.getItem(TAP_TO_PAY_MERCHANT_ENABLED_KEY);
    const match = stored === key;
    logTapToPayDebug('enablement.storage.check', {
      storageKey: TAP_TO_PAY_MERCHANT_ENABLED_KEY,
      expectedMerchantKey: maskId(key),
      storedMerchantKey: stored ? maskId(stored) : '(none)',
      match,
      note:
        stored && !match
          ? 'stored key differs from current account|location — pre-migration setup or different merchant'
          : undefined,
    });
    return match;
  } catch (err) {
    logTapToPayDebug('enablement.storage.error', {
      message: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * @param {string | null | undefined} stripeAccountId
 * @param {string | null | undefined} terminalLocationId
 */
export async function markTapToPayMerchantEnabled(stripeAccountId, terminalLocationId) {
  const key = buildTapToPayMerchantEnablementKey(stripeAccountId, terminalLocationId);
  if (!key) {
    return;
  }
  try {
    await AsyncStorage.setItem(TAP_TO_PAY_MERCHANT_ENABLED_KEY, key);
    logTapToPayDebug('enablement.storage.marked', {
      storageKey: TAP_TO_PAY_MERCHANT_ENABLED_KEY,
      merchantKey: maskId(key),
    });
  } catch {
    /* ignore */
  }
}

export async function clearTapToPayMerchantEnabled() {
  try {
    await AsyncStorage.removeItem(TAP_TO_PAY_MERCHANT_ENABLED_KEY);
  } catch {
    /* ignore */
  }
}

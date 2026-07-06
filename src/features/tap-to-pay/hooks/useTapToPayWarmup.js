import { isTapToPayNativeRuntimeAvailable } from '../utils/isTapToPayNativeRuntimeAvailable';

/**
 * Silent Tap to Pay prep for signed-in merchants.
 * No-op in Expo Go (Stripe Terminal is not linked).
 */
export const useTapToPayWarmup = isTapToPayNativeRuntimeAvailable()
  ? require('./useTapToPayWarmupNative').useTapToPayWarmup
  : require('./useTapToPayWarmupNoop').useTapToPayWarmup;

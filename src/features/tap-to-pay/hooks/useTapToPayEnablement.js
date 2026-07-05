import { isTapToPayNativeRuntimeAvailable } from '../utils/isTapToPayNativeRuntimeAvailable';

/**
 * Tap to Pay enablement on Payments.
 * Stubbed in Expo Go (Stripe Terminal is not linked).
 */
export const useTapToPayEnablement = isTapToPayNativeRuntimeAvailable()
  ? require('./useTapToPayEnablementNative').useTapToPayEnablement
  : require('./useTapToPayEnablementNoop').useTapToPayEnablement;

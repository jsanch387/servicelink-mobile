import { isTapToPayNativeRuntimeAvailable } from '../utils/isTapToPayNativeRuntimeAvailable';

/**
 * Stripe Terminal Tap to Pay collection.
 * Stubbed in Expo Go (Stripe Terminal is not linked).
 */
export const useTapToPayTerminalCollection = isTapToPayNativeRuntimeAvailable()
  ? require('./useTapToPayTerminalCollectionNative').useTapToPayTerminalCollection
  : require('./useTapToPayTerminalCollectionNoop').useTapToPayTerminalCollection;

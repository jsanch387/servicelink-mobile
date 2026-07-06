import { isTapToPayNativeRuntimeAvailable } from '../utils/isTapToPayNativeRuntimeAvailable';

/**
 * Background reader connect while the merchant is on Complete (or another checkout surface).
 * No-op in Expo Go (Stripe Terminal is not linked).
 */
export const useTapToPayReaderPrewarm = isTapToPayNativeRuntimeAvailable()
  ? require('./useTapToPayReaderPrewarmNative').useTapToPayReaderPrewarm
  : require('./useTapToPayReaderPrewarmNoop').useTapToPayReaderPrewarm;

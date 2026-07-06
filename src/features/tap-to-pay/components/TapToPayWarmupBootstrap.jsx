import { isTapToPayNativeRuntimeAvailable } from '../utils/isTapToPayNativeRuntimeAvailable';

/**
 * Mounts silent Tap to Pay prep for signed-in merchants (SDK init + background reader connect when opted in).
 * No-op in Expo Go (Terminal native module is not linked).
 */
export function TapToPayWarmupBootstrap() {
  if (!isTapToPayNativeRuntimeAvailable()) {
    return null;
  }

  const { TapToPayWarmupBootstrapNative } = require('./TapToPayWarmupBootstrapNative');
  return <TapToPayWarmupBootstrapNative />;
}

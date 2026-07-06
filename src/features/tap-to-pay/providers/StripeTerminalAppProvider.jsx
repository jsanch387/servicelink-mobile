import { isTapToPayNativeRuntimeAvailable } from '../utils/isTapToPayNativeRuntimeAvailable';

/**
 * App-root Stripe Terminal provider. Connection tokens are fetched via
 * {@link setMerchantTapToPayConnectionTokenFetcher} (app warm-up) and
 * {@link setBookingTapToPayConnectionTokenFetcher} while the Tap to Pay sheet is open.
 *
 * Expo Go has no Terminal native module — render children only so the rest of the app can load.
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function StripeTerminalAppProvider({ children }) {
  if (!isTapToPayNativeRuntimeAvailable()) {
    return children;
  }

  const { StripeTerminalAppProviderNative } = require('./StripeTerminalAppProviderNative');
  return <StripeTerminalAppProviderNative>{children}</StripeTerminalAppProviderNative>;
}

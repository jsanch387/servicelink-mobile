import { NativeModules } from 'react-native';

/**
 * True when Stripe Terminal's native module is linked in this binary.
 * False in Expo Go and any build that was not compiled with Terminal.
 *
 * Tests always return true so unit tests exercise the real hook implementations
 * (they mock `@stripe/stripe-terminal-react-native`).
 */
export function isTapToPayNativeRuntimeAvailable() {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return true;
  }
  return Boolean(NativeModules?.StripeTerminalReactNative);
}

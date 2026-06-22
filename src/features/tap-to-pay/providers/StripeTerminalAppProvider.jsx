import { useCallback } from 'react';
import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';
import { fetchTapToPayConnectionTokenFromRegistry } from '../terminal/tapToPayConnectionTokenRegistry';

/**
 * App-root Stripe Terminal provider. Connection tokens are fetched via
 * {@link setMerchantTapToPayConnectionTokenFetcher} (app warm-up) and
 * {@link setBookingTapToPayConnectionTokenFetcher} while the Tap to Pay sheet is open.
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function StripeTerminalAppProvider({ children }) {
  const tokenProvider = useCallback(async () => {
    return fetchTapToPayConnectionTokenFromRegistry();
  }, []);

  return (
    <StripeTerminalProvider
      logLevel={typeof __DEV__ !== 'undefined' && __DEV__ ? 'verbose' : 'warning'}
      tokenProvider={tokenProvider}
    >
      {children}
    </StripeTerminalProvider>
  );
}

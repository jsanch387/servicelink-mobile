import { useCallback } from 'react';
import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';
import { fetchTapToPayConnectionTokenFromRegistry } from '../terminal/tapToPayConnectionTokenRegistry';

/**
 * Native-only Stripe Terminal provider (dev client / store builds).
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function StripeTerminalAppProviderNative({ children }) {
  const tokenProvider = useCallback(async () => {
    return fetchTapToPayConnectionTokenFromRegistry();
  }, []);

  return (
    <StripeTerminalProvider logLevel="warning" tokenProvider={tokenProvider}>
      {children}
    </StripeTerminalProvider>
  );
}

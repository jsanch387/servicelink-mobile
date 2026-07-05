import { useTapToPayWarmup } from '../hooks/useTapToPayWarmup';

/**
 * Native-only warm-up (imports Stripe Terminal).
 */
export function TapToPayWarmupBootstrapNative() {
  useTapToPayWarmup();
  return null;
}

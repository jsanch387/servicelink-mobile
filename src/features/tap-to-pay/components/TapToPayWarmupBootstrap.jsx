import { useTapToPayWarmup } from '../hooks/useTapToPayWarmup';

/**
 * Mounts silent Tap to Pay prep for signed-in merchants (SDK init + background reader connect when opted in).
 */
export function TapToPayWarmupBootstrap() {
  useTapToPayWarmup();
  return null;
}

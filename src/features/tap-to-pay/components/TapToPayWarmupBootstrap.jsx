import { useTapToPayWarmup } from '../hooks/useTapToPayWarmup';

/**
 * Mounts Tap to Pay Terminal warm-up for signed-in merchants (app launch + foreground).
 * Runs silently — no UI. Safe to mount only when the main app tabs are active.
 */
export function TapToPayWarmupBootstrap() {
  useTapToPayWarmup();
  return null;
}

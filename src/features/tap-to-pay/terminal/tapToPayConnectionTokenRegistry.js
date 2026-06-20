import { logTapToPayDebug, logTapToPayFailure } from '../utils/logTapToPayDebug';

/** @type {(() => Promise<string>) | null} */
let activeTokenFetcher = null;

/**
 * Register booking-scoped connection token fetcher while Tap to Pay sheet is open.
 *
 * @param {() => Promise<string>} fetcher
 */
export function setTapToPayConnectionTokenFetcher(fetcher) {
  activeTokenFetcher = fetcher;
  logTapToPayDebug('connection-token.registry.set');
}

export function clearTapToPayConnectionTokenFetcher() {
  activeTokenFetcher = null;
  logTapToPayDebug('connection-token.registry.clear');
}

/**
 * Called by {@link StripeTerminalAppProvider} tokenProvider when the SDK needs a token.
 *
 * @returns {Promise<string>}
 */
export async function fetchTapToPayConnectionTokenFromRegistry() {
  if (!activeTokenFetcher) {
    logTapToPayFailure('connection-token.registry', {
      message: 'Tap to Pay sheet is not active (no token fetcher registered)',
    });
    throw new Error('Tap to Pay is not active.');
  }
  logTapToPayDebug('connection-token.registry.invoke');
  return activeTokenFetcher();
}

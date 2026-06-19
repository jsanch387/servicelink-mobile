/** @type {(() => Promise<string>) | null} */
let activeTokenFetcher = null;

/**
 * Register booking-scoped connection token fetcher while Tap to Pay sheet is open.
 *
 * @param {() => Promise<string>} fetcher
 */
export function setTapToPayConnectionTokenFetcher(fetcher) {
  activeTokenFetcher = fetcher;
}

export function clearTapToPayConnectionTokenFetcher() {
  activeTokenFetcher = null;
}

/**
 * Called by {@link StripeTerminalAppProvider} tokenProvider when the SDK needs a token.
 *
 * @returns {Promise<string>}
 */
export async function fetchTapToPayConnectionTokenFromRegistry() {
  if (!activeTokenFetcher) {
    throw new Error('Tap to Pay is not active.');
  }
  return activeTokenFetcher();
}

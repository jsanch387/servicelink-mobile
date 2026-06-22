import { logTapToPayFailure } from '../utils/logTapToPayDebug';

/** @type {(() => Promise<string>) | null} */
let merchantTokenFetcher = null;

/** @type {(() => Promise<string>) | null} */
let bookingTokenFetcher = null;

/** @type {string | null} */
let bookingStripeAccountId = null;

/**
 * Register merchant-scoped connection token fetcher while signed in (app warm-up).
 *
 * @param {() => Promise<string>} fetcher
 */
export function setMerchantTapToPayConnectionTokenFetcher(fetcher) {
  merchantTokenFetcher = fetcher;
}

export function clearMerchantTapToPayConnectionTokenFetcher() {
  merchantTokenFetcher = null;
}

/**
 * Register booking-scoped connection token fetcher while Tap to Pay sheet is open.
 * Takes priority over the merchant fetcher.
 *
 * @param {() => Promise<string>} fetcher
 */
export function setBookingTapToPayConnectionTokenFetcher(fetcher) {
  bookingTokenFetcher = fetcher;
}

/** @deprecated Use setBookingTapToPayConnectionTokenFetcher */
export function setTapToPayConnectionTokenFetcher(fetcher) {
  setBookingTapToPayConnectionTokenFetcher(fetcher);
}

/**
 * Connected account for the active booking Tap to Pay session (from intent response).
 *
 * @param {string | null | undefined} stripeAccountId
 */
export function setTapToPayConnectionTokenStripeAccountId(stripeAccountId) {
  bookingStripeAccountId =
    typeof stripeAccountId === 'string' && stripeAccountId.trim() ? stripeAccountId.trim() : null;
}

export function getTapToPayConnectionTokenStripeAccountId() {
  return bookingStripeAccountId;
}

export function clearBookingTapToPayConnectionTokenFetcher() {
  bookingTokenFetcher = null;
  bookingStripeAccountId = null;
}

/** @deprecated Use clearBookingTapToPayConnectionTokenFetcher */
export function clearTapToPayConnectionTokenFetcher() {
  clearBookingTapToPayConnectionTokenFetcher();
}

/**
 * Called by {@link StripeTerminalAppProvider} tokenProvider when the SDK needs a token.
 *
 * @returns {Promise<string>}
 */
export async function fetchTapToPayConnectionTokenFromRegistry() {
  const fetcher = bookingTokenFetcher ?? merchantTokenFetcher;
  if (!fetcher) {
    logTapToPayFailure('connection-token.registry', {
      message: 'No Tap to Pay connection token fetcher registered',
    });
    throw new Error('Tap to Pay is not active.');
  }
  return fetcher();
}

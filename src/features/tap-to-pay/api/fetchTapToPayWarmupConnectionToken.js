import { logTapToPayDebug, maskId } from '../utils/logTapToPayDebug';
import { fetchTapToPayWarmupBookingId } from './fetchTapToPayWarmupBookingId';
import { postTapToPayConnectionToken } from './postTapToPayConnectionToken';
import { postTapToPayMerchantConnectionToken } from './postTapToPayMerchantConnectionToken';

/**
 * Connection token for app warm-up. Prefers the merchant route; falls back to a
 * recent booking token when the merchant API is not deployed (404).
 *
 * @param {{
 *   accessToken: string;
 *   stripeAccountId: string;
 *   businessId: string | null | undefined;
 *   warmupBookingIdRef: { current: string | null };
 * }} params
 * @returns {Promise<string>}
 */
export async function fetchTapToPayWarmupConnectionToken({
  accessToken,
  stripeAccountId,
  businessId,
  warmupBookingIdRef,
}) {
  const merchantResult = await postTapToPayMerchantConnectionToken(accessToken, {
    stripeAccountId,
  });
  if (merchantResult.ok) {
    return merchantResult.secret;
  }

  if (merchantResult.httpStatus !== 404) {
    throw merchantResult.error;
  }

  logTapToPayDebug('connection-token.merchant.missing', {
    stripeAccountId: maskId(stripeAccountId),
    httpStatus: merchantResult.httpStatus,
  });

  let bookingId = warmupBookingIdRef.current;
  if (!bookingId && businessId) {
    bookingId = await fetchTapToPayWarmupBookingId(businessId);
    warmupBookingIdRef.current = bookingId;
  }

  if (!bookingId) {
    throw new Error('Tap to Pay warm-up needs a merchant connection-token API or a booking.');
  }

  const bookingResult = await postTapToPayConnectionToken(accessToken, bookingId, {
    stripeAccountId,
  });
  if (!bookingResult.ok) {
    throw bookingResult.error;
  }

  return bookingResult.secret;
}

import { logTapToPayDebug, maskId } from '../utils/logTapToPayDebug';
import { postTapToPayMerchantConnectionToken } from './postTapToPayMerchantConnectionToken';

/**
 * Connection token for app warm-up and walk-up collection.
 * Merchant route only — do not fall back to a booking token.
 *
 * @param {{
 *   accessToken: string;
 *   stripeAccountId: string;
 * }} params
 * @returns {Promise<string>}
 */
export async function fetchTapToPayWarmupConnectionToken({ accessToken, stripeAccountId }) {
  const merchantResult = await postTapToPayMerchantConnectionToken(accessToken, {
    stripeAccountId,
  });
  if (merchantResult.ok) {
    logTapToPayDebug('connection-token.ok', {
      scope: 'merchant',
      stripeAccountId: maskId(stripeAccountId),
    });
    return merchantResult.secret;
  }

  throw merchantResult.error;
}

import { logTapToPayDebug, logTapToPayFailure, maskId } from '../utils/logTapToPayDebug';
import { postTapToPayMerchantConnectionToken } from './postTapToPayMerchantConnectionToken';

/**
 * Ask the server to ensure a Stripe Terminal location exists for this merchant,
 * then re-read payment_accounts so `stripe_terminal_location_id` is available
 * on Payments and warm-up.
 *
 * Server should call `ensureTerminalLocation` inside the merchant connection-token route.
 *
 * @param {{
 *   accessToken: string;
 *   stripeAccountId: string;
 *   refetchPayments: () => Promise<{ data?: { paymentAccount?: { stripe_terminal_location_id?: string | null } | null } | undefined }>;
 * }} params
 */
export async function provisionTapToPayMerchantSetup({
  accessToken,
  stripeAccountId,
  refetchPayments,
}) {
  const accountId = stripeAccountId.trim();
  logTapToPayDebug('provision.start', { stripeAccountId: maskId(accountId) });

  const tokenResult = await postTapToPayMerchantConnectionToken(accessToken, {
    stripeAccountId: accountId,
  });
  if (!tokenResult.ok) {
    logTapToPayFailure('provision', {
      message: tokenResult.error.message,
      httpStatus: tokenResult.httpStatus,
    });
    return { ok: false, error: tokenResult.error, terminalLocationId: null };
  }

  const refetchResult = await refetchPayments();
  const terminalLocationId =
    refetchResult.data?.paymentAccount?.stripe_terminal_location_id?.trim() ?? '';

  logTapToPayDebug('provision.ok', {
    stripeAccountId: maskId(accountId),
    terminalLocationId: terminalLocationId ? maskId(terminalLocationId) : '(still empty)',
  });

  return {
    ok: true,
    terminalLocationId: terminalLocationId || null,
  };
}

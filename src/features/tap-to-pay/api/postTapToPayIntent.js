import { tapToPayRequest } from './tapToPayRequest';
import { parseTapToPayIntentConnectParams } from '../utils/parseTapToPayIntentConnectParams';

/**
 * @typedef {object} TapToPayIntentResult
 * @property {string} paymentIntentId
 * @property {string} clientSecret
 * @property {number} amountCents
 * @property {string} currency
 * @property {import('../utils/parseTapToPayIntentConnectParams').TapToPayConnectParams} connectParams
 */

/**
 * @param {string | null | undefined} accessToken
 * @param {string} bookingId
 * @param {Array<{ kind?: 'fee' | 'discount'; label: string; amountCents: number }>} [sessionFees]
 * @param {number} [tipCents] Customer tip. Omitted when there is no tip. Not a session fee.
 * @returns {Promise<
 *   | ({ ok: true; requestId?: string } & TapToPayIntentResult)
 *   | { ok: false; error: Error; httpStatus: number; retryAfterSec?: number; requestId?: string }
 * >}
 */
export async function postTapToPayIntent(accessToken, bookingId, sessionFees = [], tipCents = 0) {
  const resolvedTipCents = Math.max(0, Math.round(Number(tipCents) || 0));
  /** @type {{ sessionFees: typeof sessionFees; tipCents?: number }} */
  const body = { sessionFees };
  if (resolvedTipCents > 0) {
    body.tipCents = resolvedTipCents;
  }
  const result = await tapToPayRequest(accessToken, bookingId, 'intent', body);
  if (!result.ok) {
    return result;
  }

  const paymentIntentId =
    typeof result.payload?.paymentIntentId === 'string'
      ? result.payload.paymentIntentId.trim()
      : '';
  const clientSecret =
    typeof result.payload?.clientSecret === 'string' ? result.payload.clientSecret.trim() : '';
  const amountCents = Math.max(0, Math.round(Number(result.payload?.amountCents) || 0));
  const currency =
    String(result.payload?.currency ?? 'usd')
      .trim()
      .toLowerCase() || 'usd';

  if (!paymentIntentId || !clientSecret || amountCents <= 0) {
    return {
      ok: false,
      error: new Error('Couldn’t start Tap to Pay. Try again or mark as paid.'),
      httpStatus: 500,
      requestId: result.requestId,
    };
  }

  return {
    ok: true,
    paymentIntentId,
    clientSecret,
    amountCents,
    currency,
    connectParams: parseTapToPayIntentConnectParams(result.payload),
    requestId: result.requestId,
  };
}

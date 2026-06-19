import { tapToPayRequest } from './tapToPayRequest';

/**
 * @param {string | null | undefined} accessToken
 * @param {string} bookingId
 * @returns {Promise<
 *   | { ok: true; secret: string; requestId?: string }
 *   | { ok: false; error: Error; httpStatus: number; retryAfterSec?: number; requestId?: string }
 * >}
 */
export async function postTapToPayConnectionToken(accessToken, bookingId) {
  const result = await tapToPayRequest(accessToken, bookingId, 'connection-token');
  if (!result.ok) {
    return result;
  }

  const secret = typeof result.payload?.secret === 'string' ? result.payload.secret.trim() : '';
  if (!secret) {
    return {
      ok: false,
      error: new Error('Couldn’t connect to payments. Try again or mark as paid.'),
      httpStatus: 500,
      requestId: result.requestId,
    };
  }

  return { ok: true, secret, requestId: result.requestId };
}

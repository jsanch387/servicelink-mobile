import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import {
  CREATE_PAYMENT_MAX_AMOUNT_CENTS,
  CREATE_PAYMENT_MIN_AMOUNT_CENTS,
  sanitizeCreatePaymentNote,
} from '../../payments/create-payment/utils/createPaymentAmount';
import { parseTapToPayIntentConnectParams } from '../utils/parseTapToPayIntentConnectParams';
import { logTapToPayDebug, logTapToPayFailure, maskId } from '../utils/logTapToPayDebug';
import { mapTapToPayHttpError } from '../utils/mapTapToPayHttpError';

function readRetryAfterSec(res) {
  const raw = (res.headers.get('Retry-After') ?? res.headers.get('retry-after'))?.trim();
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return undefined;
  }
  return Math.round(n);
}

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Walk-up Tap to Pay PaymentIntent (no booking).
 *
 * Server: `POST /api/payments/tap-to-pay/intent`
 *
 * @param {string | null | undefined} accessToken
 * @param {{
 *   amountCents: number;
 *   note?: string | null;
 *   stripeAccountId?: string | null;
 * }} options
 * @returns {Promise<
 *   | {
 *       ok: true;
 *       paymentIntentId: string;
 *       clientSecret: string;
 *       amountCents: number;
 *       currency: string;
 *       connectParams: import('../utils/parseTapToPayIntentConnectParams').TapToPayConnectParams;
 *       requestId?: string;
 *     }
 *   | { ok: false; error: Error; httpStatus: number; requestId?: string; retryAfterSec?: number }
 * >}
 */
export async function postTapToPayMerchantIntent(accessToken, options) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }

  const amountCents = Math.max(0, Math.round(Number(options?.amountCents) || 0));
  if (amountCents < CREATE_PAYMENT_MIN_AMOUNT_CENTS || amountCents > CREATE_PAYMENT_MAX_AMOUNT_CENTS) {
    return { ok: false, error: new Error('Enter an amount greater than $0.'), httpStatus: 0 };
  }

  const note = sanitizeCreatePaymentNote(options?.note);
  if (!note) {
    return { ok: false, error: new Error('Add a short note for what this payment is for.'), httpStatus: 0 };
  }

  const stripeAccountId =
    typeof options?.stripeAccountId === 'string' ? options.stripeAccountId.trim() : '';
  const body = {
    amountCents,
    currency: 'usd',
    note,
    ...(stripeAccountId ? { stripeAccountId } : {}),
  };
  const requestId = createRequestId();
  const url = `${origin}/api/payments/tap-to-pay/intent`;

  logTapToPayDebug('api.request', {
    route: 'merchant-intent',
    origin,
    amountCents,
    stripeAccountId: maskId(stripeAccountId),
    requestId,
  });

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    logTapToPayFailure('merchant-intent', {
      message: err instanceof Error ? err.message : 'Network request failed',
      httpStatus: 0,
      requestId,
      url,
    });
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  const echoedRequestId =
    (res.headers.get('X-Request-ID') ?? res.headers.get('x-request-id'))?.trim() || requestId;

  let payload = {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  const serverMessage = typeof payload?.error === 'string' ? payload.error : null;

  if (res.ok && payload?.success === true) {
    const paymentIntentId =
      typeof payload?.paymentIntentId === 'string' ? payload.paymentIntentId.trim() : '';
    const clientSecret =
      typeof payload?.clientSecret === 'string' ? payload.clientSecret.trim() : '';
    const resolvedCents = Math.max(0, Math.round(Number(payload?.amountCents) || 0));
    const currency =
      String(payload?.currency ?? 'usd')
        .trim()
        .toLowerCase() || 'usd';

    if (!paymentIntentId || !clientSecret || resolvedCents <= 0) {
      return {
        ok: false,
        error: new Error('Couldn’t start Tap to Pay. Try again.'),
        httpStatus: 500,
        requestId: echoedRequestId,
      };
    }

    logTapToPayDebug('api.success', {
      route: 'merchant-intent',
      httpStatus: res.status,
      requestId: echoedRequestId,
      paymentIntentId: maskId(paymentIntentId),
      amountCents: resolvedCents,
    });

    return {
      ok: true,
      paymentIntentId,
      clientSecret,
      amountCents: resolvedCents,
      currency,
      connectParams: parseTapToPayIntentConnectParams(payload),
      requestId: echoedRequestId,
    };
  }

  const mappedError = mapTapToPayHttpError(res.status, serverMessage, 'merchant');
  const retryAfterSec = res.status === 429 ? readRetryAfterSec(res) : undefined;
  logTapToPayFailure('merchant-intent', {
    message: serverMessage ?? mappedError,
    httpStatus: res.status,
    requestId: echoedRequestId,
    url,
  });

  return {
    ok: false,
    error: new Error(mappedError),
    httpStatus: res.status,
    requestId: echoedRequestId,
    ...(retryAfterSec != null ? { retryAfterSec } : {}),
  };
}

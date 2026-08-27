import { productionWebApiHttpsGuard } from '../../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../../lib/stripeMobileCheckoutOrigin';
import {
  CREATE_PAYMENT_MAX_AMOUNT_CENTS,
  CREATE_PAYMENT_MIN_AMOUNT_CENTS,
  sanitizeCreatePaymentNote,
} from '../utils/createPaymentAmount';

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function readUrl(payload) {
  const candidates = [payload?.url, payload?.paymentUrl, payload?.checkoutUrl];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().startsWith('http')) {
      return value.trim();
    }
  }
  return '';
}

function readRetryAfterSec(res) {
  const raw = (res.headers.get('Retry-After') ?? res.headers.get('retry-after'))?.trim();
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return undefined;
  }
  return Math.round(n);
}

/**
 * @param {number} httpStatus
 * @param {string} serverMessage
 */
export function mapCreatePaymentLinkHttpError(httpStatus, serverMessage) {
  const fallback = serverMessage.trim();
  switch (httpStatus) {
    case 400:
      return fallback || 'Enter an amount greater than $0.';
    case 401:
      return fallback || 'Sign in again to create a payment link.';
    case 404:
      return fallback || 'Business profile not found.';
    case 422:
      return fallback || 'Set up Stripe payments to create a payment link.';
    case 429:
      return fallback || 'Too many payment links. Please wait a moment and try again.';
    case 0:
      return fallback || 'Network error. Check your connection and try again.';
    default:
      return fallback || 'Couldn’t create a payment link. Try again.';
  }
}

/**
 * Walk-up payment link (no booking). Server creates a one-time Checkout Session
 * and stores `payment_requests` — not `booking_payments`.
 *
 * Server: `POST /api/payments/link`
 *
 * Body: `{ amountCents, currency: 'usd', note }`
 * Success: `{ success: true, url }` (`paymentUrl` / `checkoutUrl` also accepted)
 *
 * @param {string | null | undefined} accessToken
 * @param {{ amountCents: number; note?: string | null }} options
 * @returns {Promise<
 *   | {
 *       ok: true;
 *       url: string;
 *       paymentLinkId?: string;
 *       paymentRequestId?: string;
 *       requestId?: string;
 *     }
 *   | { ok: false; error: Error; httpStatus: number; requestId?: string; retryAfterSec?: number }
 * >}
 */
export async function postCreatePaymentLink(accessToken, options) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }

  const amountCents = Math.max(0, Math.round(Number(options?.amountCents) || 0));
  if (
    amountCents < CREATE_PAYMENT_MIN_AMOUNT_CENTS ||
    amountCents > CREATE_PAYMENT_MAX_AMOUNT_CENTS
  ) {
    return { ok: false, error: new Error('Enter an amount.'), httpStatus: 0 };
  }

  const note = sanitizeCreatePaymentNote(options?.note);
  if (!note) {
    return { ok: false, error: new Error('Add what it’s for.'), httpStatus: 0 };
  }

  const requestId = createRequestId();
  const url = `${origin}/api/payments/link`;

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
      body: JSON.stringify({
        amountCents,
        currency: 'usd',
        note,
      }),
    });
  } catch (err) {
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

  const serverMessage = typeof payload?.error === 'string' ? payload.error.trim() : '';
  const paymentUrl = readUrl(payload);

  if (res.ok && payload?.success === true && paymentUrl) {
    const paymentLinkId =
      typeof payload?.paymentLinkId === 'string' ? payload.paymentLinkId.trim() : '';
    const paymentRequestId =
      typeof payload?.paymentRequestId === 'string' ? payload.paymentRequestId.trim() : '';
    return {
      ok: true,
      url: paymentUrl,
      ...(paymentLinkId ? { paymentLinkId } : {}),
      ...(paymentRequestId ? { paymentRequestId } : {}),
      requestId: echoedRequestId,
    };
  }

  const retryAfterSec = res.status === 429 ? readRetryAfterSec(res) : undefined;

  return {
    ok: false,
    error: new Error(mapCreatePaymentLinkHttpError(res.status, serverMessage)),
    httpStatus: res.status,
    requestId: echoedRequestId,
    ...(retryAfterSec != null ? { retryAfterSec } : {}),
  };
}

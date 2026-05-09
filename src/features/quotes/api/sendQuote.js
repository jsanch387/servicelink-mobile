import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import { quotesDebug, quotesDebugError } from '../utils/quotesDebug';

/**
 * Contract: production traffic must use TLS (`https:`).
 * @param {string} origin
 * @returns {Error | null}
 */
function productionHttpsGuard(origin) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return null;
  }
  try {
    const u = new URL(origin);
    if (u.protocol !== 'https:') {
      return new Error(
        'Production quote API requires HTTPS — set EXPO_PUBLIC_WEB_APP_URL to an https:// origin.',
      );
    }
  } catch {
    return new Error('Invalid EXPO_PUBLIC_WEB_APP_URL');
  }
  return null;
}

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @param {Headers} headers
 * @returns {string | undefined}
 */
function readRequestIdHeader(headers) {
  return (
    (
      headers.get('X-Request-ID') ??
      headers.get('x-request-id') ??
      headers.get('X-Correlation-ID') ??
      headers.get('x-correlation-id') ??
      undefined
    )?.trim() || undefined
  );
}

/**
 * @param {number} httpStatus
 * @param {string | null} serverMessage
 * @returns {string}
 */
export function mapSendQuoteHttpError(httpStatus, serverMessage) {
  const fallback = serverMessage?.trim() || null;
  if (httpStatus === 401) {
    return 'Sign in to send quotes.';
  }
  if (httpStatus === 403) {
    return "You don't have permission to send quotes for this business.";
  }
  if (httpStatus === 404) {
    return 'Not found. Your business may not be set up on the server yet, or this quote may have been deleted.';
  }
  if (httpStatus === 409) {
    return 'This quote was already sent. Edit it on the web app if you need to change details.';
  }
  if (httpStatus === 400) {
    return fallback || 'Check the form and try again.';
  }
  if (httpStatus === 500) {
    return fallback || 'Something went wrong on the server. Try again in a moment.';
  }
  if (httpStatus === 0) {
    return fallback || 'Network error. Check your connection and try again.';
  }
  return fallback || `Could not send quote (${httpStatus}).`;
}

/**
 * @param {string | null | undefined} accessToken
 * @param {Record<string, unknown>} body
 * @returns {Promise<
 *   | { ok: true; quoteId: string; publicUrl: string; expiresAt: string }
 *   | { ok: false; error: Error; httpStatus: number; requestId?: string }
 * >}
 */
export async function postSendNewQuote(accessToken, body) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }

  const requestId = createRequestId();
  quotesDebug('postSendQuote:start', { mode: 'new', requestId });

  let res;
  try {
    res = await fetch(`${origin}/api/quotes/send`, {
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
    quotesDebugError(
      'postSendQuote:network',
      err instanceof Error ? err.message : 'Network request failed',
      {
        mode: 'new',
        requestId,
      },
    );
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  return parseSendQuoteResponse(res, {
    successStatuses: [201],
    sentRequestId: requestId,
    mode: 'new',
  });
}

/**
 * @param {string | null | undefined} accessToken
 * @param {string} quoteId
 * @param {Record<string, unknown>} body
 * @returns {Promise<
 *   | { ok: true; quoteId: string; publicUrl: string; expiresAt: string }
 *   | { ok: false; error: Error; httpStatus: number; requestId?: string }
 * >}
 */
export async function postSendExistingQuote(accessToken, quoteId, body) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }
  const id = String(quoteId ?? '').trim();
  if (!id) {
    return { ok: false, error: new Error('Missing quote id'), httpStatus: 0 };
  }

  const requestId = createRequestId();
  quotesDebug('postSendQuote:start', { mode: 'existing', quoteId: id, requestId });

  let res;
  try {
    res = await fetch(`${origin}/api/quotes/${encodeURIComponent(id)}/send`, {
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
    quotesDebugError(
      'postSendQuote:network',
      err instanceof Error ? err.message : 'Network request failed',
      {
        mode: 'existing',
        requestId,
        quoteId: id,
      },
    );
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  return parseSendQuoteResponse(res, {
    successStatuses: [200],
    sentRequestId: requestId,
    mode: 'existing',
    quoteId: id,
  });
}

/**
 * @param {Response} res
 * @param {{ successStatuses: number[]; sentRequestId: string; mode: 'new' | 'existing'; quoteId?: string }} opts
 * @returns {Promise<
 *   | { ok: true; quoteId: string; publicUrl: string; expiresAt: string }
 *   | { ok: false; error: Error; httpStatus: number; requestId?: string }
 * >}
 */
async function parseSendQuoteResponse(res, opts) {
  const echoedId = readRequestIdHeader(res.headers) ?? opts.sentRequestId;

  let body = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  const serverError =
    typeof body?.error === 'string'
      ? body.error
      : typeof body?.message === 'string'
        ? body.message
        : null;

  const data = body?.data && typeof body.data === 'object' ? body.data : null;
  const quoteId = data && typeof data.quoteId === 'string' ? data.quoteId.trim() : '';
  const publicUrl = data && typeof data.publicUrl === 'string' ? data.publicUrl.trim() : '';
  const expiresAt = data && typeof data.expiresAt === 'string' ? data.expiresAt.trim() : '';

  const okShape = quoteId && publicUrl && expiresAt;
  const statusOk = opts.successStatuses.includes(res.status);

  if (statusOk && body?.success === true && okShape) {
    quotesDebug('postSendQuote:ok', {
      mode: opts.mode,
      httpStatus: res.status,
      requestId: echoedId,
      quoteId,
    });
    return { ok: true, quoteId, publicUrl, expiresAt };
  }

  const msg = mapSendQuoteHttpError(res.status, serverError);
  quotesDebugError('postSendQuote:fail', msg, {
    mode: opts.mode,
    httpStatus: res.status,
    requestId: echoedId,
    quoteId: opts.quoteId,
  });
  return { ok: false, error: new Error(msg), httpStatus: res.status, requestId: echoedId };
}

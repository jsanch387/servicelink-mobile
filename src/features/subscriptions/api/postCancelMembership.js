import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';

export const CANCEL_MEMBERSHIP_PERIOD_END = 'cancel_at_period_end';
export const CANCEL_MEMBERSHIP_NOW = 'cancel_now';

const CANCEL_MEMBERSHIP_TIMEOUT_MS = 30_000;

const CANCEL_ACTIONS = new Set([CANCEL_MEMBERSHIP_PERIOD_END, CANCEL_MEMBERSHIP_NOW]);

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @param {unknown} body
 */
function readServerErrorMessage(body) {
  if (body && typeof body === 'object') {
    if (typeof body.error === 'string' && body.error.trim()) return body.error.trim();
    if (typeof body.message === 'string' && body.message.trim()) return body.message.trim();
  }
  return null;
}

/**
 * @param {unknown} raw
 * @returns {Record<string, unknown> | null}
 */
export function readCancelMembershipSubscriber(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id) return null;
  return /** @type {Record<string, unknown>} */ (raw);
}

/**
 * @param {number} httpStatus
 * @param {string | null} serverMessage
 * @param {string | null | undefined} gate
 */
export function mapCancelMembershipHttpError(httpStatus, serverMessage, gate) {
  const fallback = serverMessage?.trim() || null;

  if (httpStatus === 401) {
    return 'Sign in again to cancel this subscription.';
  }
  if (httpStatus === 403) {
    if (gate === 'not_pro') return fallback || 'Upgrade to Pro to manage subscriptions.';
    if (gate === 'needs_connect') {
      return fallback || 'Connect Stripe before canceling subscriptions.';
    }
    if (gate === 'needs_payments') {
      return fallback || 'Turn on ServiceLink payments before canceling subscriptions.';
    }
    return fallback || "You don't have permission to cancel this subscription.";
  }
  if (httpStatus === 400) {
    return fallback || 'Could not cancel this subscription.';
  }
  if (httpStatus === 404) {
    return fallback || 'Subscriber not found.';
  }
  if (httpStatus === 502) {
    return fallback || 'Could not cancel this subscription in Stripe.';
  }
  if (httpStatus >= 500) {
    return fallback || 'Could not cancel this subscription. Try again in a moment.';
  }
  if (httpStatus === 0) {
    return fallback || 'Network error. Check your connection and try again.';
  }
  return fallback || `Could not cancel subscription (${httpStatus}).`;
}

/**
 * Owner cancels a customer membership via the server (Stripe + row upsert).
 *
 * @param {string | null | undefined} accessToken
 * @param {string} subscriberId `customer_memberships.id`
 * @param {'cancel_at_period_end' | 'cancel_now'} action
 * @returns {Promise<
 *   | { ok: true; alreadyCanceled: boolean; subscriber: Record<string, unknown> }
 *   | { ok: false; error: Error; httpStatus: number; gate?: string | null }
 * >}
 */
export async function postCancelMembership(accessToken, subscriberId, action) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }
  const id = String(subscriberId ?? '').trim();
  if (!id) {
    return { ok: false, error: new Error('Missing subscriber'), httpStatus: 0 };
  }
  if (!CANCEL_ACTIONS.has(action)) {
    return { ok: false, error: new Error('Could not cancel this subscription.'), httpStatus: 400 };
  }

  const requestId = createRequestId();
  const encodedId = encodeURIComponent(id);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CANCEL_MEMBERSHIP_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${origin}/api/memberships/subscribers/${encodedId}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify({ action }),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted =
      controller.signal.aborted ||
      (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError');
    return {
      ok: false,
      error: new Error(
        aborted
          ? 'That took too long. Check your connection and try again.'
          : err instanceof Error
            ? err.message
            : 'Network request failed',
      ),
      httpStatus: 0,
    };
  } finally {
    clearTimeout(timeoutId);
  }

  let payload = /** @type {Record<string, unknown> | null} */ (null);
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  const gate = typeof payload?.gate === 'string' ? payload.gate : null;
  const serverMessage = readServerErrorMessage(payload);
  const subscriber = readCancelMembershipSubscriber(payload?.subscriber);

  if (!res.ok || payload?.success !== true || !subscriber) {
    return {
      ok: false,
      error: new Error(mapCancelMembershipHttpError(res.status, serverMessage, gate)),
      httpStatus: res.status,
      gate,
    };
  }

  return {
    ok: true,
    alreadyCanceled: Boolean(payload.alreadyCanceled),
    subscriber,
  };
}

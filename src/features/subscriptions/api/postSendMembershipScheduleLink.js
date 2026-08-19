import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';

const SEND_SCHEDULE_LINK_TIMEOUT_MS = 30_000;

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @param {Headers} headers
 * @returns {number | undefined}
 */
function readRetryAfterSeconds(headers) {
  const raw = headers.get('Retry-After') ?? headers.get('retry-after');
  if (!raw) return undefined;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
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
 * @param {number} httpStatus
 * @param {string | null} serverMessage
 * @param {string | null | undefined} gate
 */
export function mapSendScheduleLinkHttpError(httpStatus, serverMessage, gate) {
  const fallback = serverMessage?.trim() || null;

  if (httpStatus === 401) {
    return 'Sign in again to send a schedule link.';
  }
  if (httpStatus === 403) {
    if (gate === 'not_pro') return fallback || 'Upgrade to Pro to offer subscriptions.';
    if (gate === 'needs_connect') {
      return fallback || 'Connect Stripe before sending schedule links.';
    }
    if (gate === 'needs_payments') {
      return fallback || 'Turn on ServiceLink payments before sending schedule links.';
    }
    return fallback || "You don't have permission to send this link.";
  }
  if (httpStatus === 400) {
    return fallback || 'Add an email or phone so we can send a schedule link.';
  }
  if (httpStatus === 404) {
    return fallback || 'Subscriber not found.';
  }
  if (httpStatus === 409) {
    return fallback || 'A visit is already set for this period.';
  }
  if (httpStatus === 429) {
    return fallback || 'Already sent. Try again in a few minutes.';
  }
  if (httpStatus >= 500) {
    return fallback || 'Could not send the schedule link. Try again in a moment.';
  }
  if (httpStatus === 0) {
    return fallback || 'Network error. Check your connection and try again.';
  }
  return fallback || `Could not send schedule link (${httpStatus}).`;
}

/**
 * Owner sends the public membership visit schedule link (email and/or SMS).
 * Server owns the signed URL, templates, and throttle stamps.
 *
 * @param {string | null | undefined} accessToken
 * @param {string} subscriberId `customer_memberships.id`
 * @returns {Promise<
 *   | { ok: true; emailed: boolean; smsed: boolean; scheduleUrl: string }
 *   | { ok: false; error: Error; httpStatus: number; retryAfterSec?: number; gate?: string | null }
 * >}
 */
export async function postSendMembershipScheduleLink(accessToken, subscriberId) {
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

  const requestId = createRequestId();
  const encodedId = encodeURIComponent(id);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SEND_SCHEDULE_LINK_TIMEOUT_MS);

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
      body: JSON.stringify({ action: 'send_schedule_link' }),
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
  const scheduleUrl = typeof payload?.scheduleUrl === 'string' ? payload.scheduleUrl.trim() : '';
  const retryAfterSec = readRetryAfterSeconds(res.headers);

  if (!res.ok || payload?.success !== true || !scheduleUrl) {
    return {
      ok: false,
      error: new Error(mapSendScheduleLinkHttpError(res.status, serverMessage, gate)),
      httpStatus: res.status,
      retryAfterSec,
      gate,
    };
  }

  return {
    ok: true,
    emailed: Boolean(payload.emailed),
    smsed: Boolean(payload.smsed),
    scheduleUrl,
  };
}

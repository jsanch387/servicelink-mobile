import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';

/**
 * @typedef {{
 *   intervalUnit: 'week' | 'month' | 'year';
 *   intervalCount: number;
 *   priceCents: number;
 * }} MembershipPlanCadenceOptionInput
 */

/**
 * @typedef {{
 *   name: string;
 *   description?: string;
 *   visitDurationMinutes?: number;
 *   cadenceOptions: MembershipPlanCadenceOptionInput[];
 *   businessId?: string | null;
 * }} MembershipPlanWriteBody
 */

/**
 * @typedef {{
 *   id: string;
 *   name: string;
 *   description: string;
 *   visitDurationMinutes: number;
 *   cadenceOptions: Array<{
 *     id: string;
 *     intervalUnit: string;
 *     intervalCount: number;
 *     priceCents: number;
 *     isDefault: boolean;
 *   }>;
 *   createdAt?: string;
 *   isPublished?: boolean;
 *   activeSubscriberCount?: number;
 * }} OwnerSubscriptionPlanDto
 */

export const MEMBERSHIP_PLAN_DELETE_HAS_SUBSCRIBERS = 'has_subscribers';

/** Fail hung create/edit/delete calls instead of spinning forever when the API is down. */
const MEMBERSHIP_PLAN_WRITE_TIMEOUT_MS = 30_000;

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @param {Headers} headers
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
 * @param {string | null | undefined} code
 */
export function mapMembershipPlanWriteHttpError(httpStatus, serverMessage, gate, code) {
  const fallback = serverMessage?.trim() || null;

  if (httpStatus === 401) {
    return 'Sign in to manage subscriptions.';
  }

  if (httpStatus === 403) {
    if (gate === 'not_pro') {
      return fallback || 'Upgrade to Pro to offer subscriptions.';
    }
    if (gate === 'needs_connect') {
      return fallback || 'Connect Stripe before managing subscriptions.';
    }
    if (gate === 'needs_payments') {
      return fallback || 'Turn on ServiceLink payments before managing subscriptions.';
    }
    if (gate === 'not_in_rollout') {
      return fallback || 'Subscriptions aren’t available for your account yet.';
    }
    return fallback || "You don't have permission to manage subscriptions.";
  }

  if (httpStatus === 404) {
    return fallback || 'Subscription not found. It may have been deleted.';
  }

  if (httpStatus === 409 && code === MEMBERSHIP_PLAN_DELETE_HAS_SUBSCRIBERS) {
    return (
      fallback ||
      'This subscription still has active subscribers. Move or cancel them before deleting.'
    );
  }

  if (httpStatus === 400) {
    return fallback || 'Check the form and try again.';
  }

  if (httpStatus >= 500) {
    return fallback || 'Something went wrong on the server. Try again in a moment.';
  }

  if (httpStatus === 0) {
    return fallback || 'Network error. Check your connection and try again.';
  }

  return fallback || `Could not save subscription (${httpStatus}).`;
}

/**
 * @param {object} args
 * @param {string | null | undefined} args.accessToken
 * @param {string} args.method
 * @param {string} args.path
 * @param {Record<string, unknown> | null} [args.body]
 * @returns {Promise<
 *   | { ok: true; data: Record<string, unknown>; requestId?: string; httpStatus: number }
 *   | {
 *       ok: false;
 *       error: Error;
 *       httpStatus: number;
 *       requestId?: string;
 *       gate?: string | null;
 *       code?: string | null;
 *     }
 * >}
 */
async function membershipPlanFetch({ accessToken, method, path, body = null }) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }

  const requestId = createRequestId();
  /** @type {Record<string, string>} */
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'X-Request-ID': requestId,
  };
  if (body != null) {
    headers['Content-Type'] = 'application/json';
  }

  let res;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MEMBERSHIP_PLAN_WRITE_TIMEOUT_MS);
  try {
    res = await fetch(`${origin}${path}`, {
      method,
      headers,
      signal: controller.signal,
      ...(body != null ? { body: JSON.stringify(body) } : null),
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
      requestId,
    };
  } finally {
    clearTimeout(timeoutId);
  }

  const echoedId = readRequestIdHeader(res.headers) ?? requestId;

  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }

  const gate = typeof json?.gate === 'string' ? json.gate : null;
  const code = typeof json?.code === 'string' ? json.code : null;
  const serverMessage = readServerErrorMessage(json);
  const failed = !res.ok || json?.success === false;

  if (failed) {
    return {
      ok: false,
      error: new Error(mapMembershipPlanWriteHttpError(res.status, serverMessage, gate, code)),
      httpStatus: res.status,
      requestId: echoedId,
      gate,
      code,
    };
  }

  return {
    ok: true,
    data: json && typeof json === 'object' ? json : {},
    requestId: echoedId,
    httpStatus: res.status,
  };
}

/**
 * POST `/api/memberships/plans`
 * @param {string | null | undefined} accessToken
 * @param {MembershipPlanWriteBody} body
 */
export async function createMembershipPlanViaApi(accessToken, body) {
  const result = await membershipPlanFetch({
    accessToken,
    method: 'POST',
    path: '/api/memberships/plans',
    body: /** @type {Record<string, unknown>} */ (body),
  });
  if (!result.ok) return result;
  const plan = result.data?.plan;
  if (!plan || typeof plan !== 'object') {
    return {
      ok: false,
      error: new Error('Invalid response'),
      httpStatus: result.httpStatus,
      requestId: result.requestId,
    };
  }
  return {
    ok: true,
    plan: /** @type {OwnerSubscriptionPlanDto} */ (plan),
    requestId: result.requestId,
  };
}

/**
 * PATCH `/api/memberships/plans/:planId`
 * @param {string | null | undefined} accessToken
 * @param {string} planId
 * @param {MembershipPlanWriteBody} body
 */
export async function updateMembershipPlanViaApi(accessToken, planId, body) {
  const id = encodeURIComponent(String(planId ?? '').trim());
  const result = await membershipPlanFetch({
    accessToken,
    method: 'PATCH',
    path: `/api/memberships/plans/${id}`,
    body: /** @type {Record<string, unknown>} */ (body),
  });
  if (!result.ok) return result;
  const plan = result.data?.plan;
  if (!plan || typeof plan !== 'object') {
    return {
      ok: false,
      error: new Error('Invalid response'),
      httpStatus: result.httpStatus,
      requestId: result.requestId,
    };
  }
  return {
    ok: true,
    plan: /** @type {OwnerSubscriptionPlanDto} */ (plan),
    requestId: result.requestId,
  };
}

/**
 * DELETE `/api/memberships/plans/:planId`
 * @param {string | null | undefined} accessToken
 * @param {string} planId
 * @param {{ businessId?: string | null }} [opts]
 */
export async function deleteMembershipPlanViaApi(accessToken, planId, opts = {}) {
  const id = encodeURIComponent(String(planId ?? '').trim());
  const businessId = String(opts.businessId ?? '').trim();
  const result = await membershipPlanFetch({
    accessToken,
    method: 'DELETE',
    path: `/api/memberships/plans/${id}`,
    body: businessId ? { businessId } : {},
  });
  if (!result.ok) return result;
  return {
    ok: true,
    activeSubscriberCount: Math.max(0, Math.round(Number(result.data?.activeSubscriberCount)) || 0),
    requestId: result.requestId,
  };
}

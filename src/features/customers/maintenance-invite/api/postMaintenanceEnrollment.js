import { productionWebApiHttpsGuard } from '../../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../../lib/stripeMobileCheckoutOrigin';

/**
 * @typedef {object} MaintenanceEnrollmentSendData
 * @property {string} id
 * @property {string} customerViewUrl
 * @property {boolean} emailSent
 * @property {string} [notifiedEmail]
 * @property {string} [emailError]
 */

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
export function mapMaintenanceEnrollmentHttpError(httpStatus, serverMessage) {
  const fallback = serverMessage?.trim() || null;
  if (httpStatus === 401) {
    return 'Sign in to send maintenance offers.';
  }
  if (httpStatus === 403) {
    return "You don't have permission to send offers for this business.";
  }
  if (httpStatus === 404) {
    return 'Customer not found. They may have been removed.';
  }
  if (httpStatus === 400) {
    return fallback || 'Check the form and try again.';
  }
  if (httpStatus === 409) {
    return (
      fallback ||
      'That time is unavailable. Try a different date or time, or try again in a moment.'
    );
  }
  if (httpStatus === 500) {
    return fallback || 'Something went wrong on the server. Try again in a moment.';
  }
  if (httpStatus === 0) {
    return fallback || 'Network error. Check your connection and try again.';
  }
  return fallback || `Could not send offer (${httpStatus}).`;
}

/**
 * `POST /api/maintenance/enrollments` — same handler as web CRM enroll flow.
 *
 * @param {string | null | undefined} accessToken
 * @param {Record<string, unknown>} body
 * @returns {Promise<
 *   | { ok: true; data: MaintenanceEnrollmentSendData; requestId?: string }
 *   | { ok: false; error: Error; httpStatus: number; requestId?: string }
 * >}
 */
export async function postMaintenanceEnrollment(accessToken, body) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }

  const requestId = createRequestId();

  let res;
  try {
    res = await fetch(`${origin}/api/maintenance/enrollments`, {
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
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  const echoedRequestId = readRequestIdHeader(res.headers) ?? requestId;

  let payload = {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  const serverError =
    typeof payload?.error === 'string'
      ? payload.error
      : typeof payload?.message === 'string'
        ? payload.message
        : null;

  const rawData = payload?.data && typeof payload.data === 'object' ? payload.data : null;
  const id = rawData && typeof rawData.id === 'string' ? rawData.id.trim() : '';
  const customerViewUrl =
    rawData && typeof rawData.customerViewUrl === 'string' ? rawData.customerViewUrl.trim() : '';
  const emailSent = rawData && typeof rawData.emailSent === 'boolean' ? rawData.emailSent : false;
  const notifiedEmail =
    rawData && typeof rawData.notifiedEmail === 'string' ? rawData.notifiedEmail.trim() : undefined;
  const emailError =
    rawData && typeof rawData.emailError === 'string' ? rawData.emailError.trim() : undefined;

  if (res.status === 201 && payload?.success === true && id && customerViewUrl) {
    return {
      ok: true,
      data: {
        id,
        customerViewUrl,
        emailSent,
        notifiedEmail,
        emailError,
      },
      requestId: echoedRequestId,
    };
  }

  const msg = mapMaintenanceEnrollmentHttpError(res.status, serverError);
  return {
    ok: false,
    error: new Error(msg),
    httpStatus: res.status,
    requestId: echoedRequestId,
  };
}

import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import {
  TEAM_INVITE_DUPLICATE_EMAIL,
  TEAM_INVITE_INVALID_EMAIL,
} from '../constants/teamMembersCopy';

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @param {unknown} body
 * @returns {string | null}
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
 * @returns {string}
 */
export function mapTeamInviteHttpError(httpStatus, serverMessage) {
  const fallback = serverMessage?.trim() || null;
  if (httpStatus === 400) {
    return fallback || TEAM_INVITE_INVALID_EMAIL;
  }
  if (httpStatus === 401) {
    return fallback || 'Sign in again to invite a team member.';
  }
  if (httpStatus === 403) {
    return fallback || 'Only the shop owner can invite team members.';
  }
  if (httpStatus === 409) {
    return fallback || TEAM_INVITE_DUPLICATE_EMAIL;
  }
  if (httpStatus >= 500) {
    return fallback || 'Couldn’t send invite. Try again in a moment.';
  }
  if (httpStatus === 0) {
    return fallback || 'Network error. Check your connection and try again.';
  }
  return fallback || `Couldn’t send invite (${httpStatus}).`;
}

/**
 * Owner sends or resends a team invite. Hire accepts on web.
 *
 * @param {string | null | undefined} accessToken
 * @param {string} email
 * @param {string} [name]
 * @returns {Promise<
 *   | { ok: true; resent: boolean; name: string; inviteId: string | null }
 *   | { ok: false; error: Error; httpStatus: number; userMessage: string }
 * >}
 */
export async function postTeamInvite(accessToken, email, name = '') {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return {
      ok: false,
      error: httpsErr,
      httpStatus: 0,
      userMessage: mapTeamInviteHttpError(0, httpsErr.message),
    };
  }
  if (!accessToken) {
    return {
      ok: false,
      error: new Error('Not signed in'),
      httpStatus: 0,
      userMessage: mapTeamInviteHttpError(401, null),
    };
  }

  const requestId = createRequestId();
  let res;
  try {
    res = await fetch(`${origin}/api/team/invites`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify({
        email,
        ...(String(name ?? '').trim() ? { name: String(name).trim() } : {}),
      }),
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Network request failed');
    return {
      ok: false,
      error,
      httpStatus: 0,
      userMessage: mapTeamInviteHttpError(0, error.message),
    };
  }

  let payload = /** @type {Record<string, unknown> | null} */ (null);
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  const serverError = readServerErrorMessage(payload);
  if (!res.ok || payload?.ok !== true) {
    const userMessage = mapTeamInviteHttpError(res.status, serverError);
    return {
      ok: false,
      error: new Error(serverError || userMessage),
      httpStatus: res.status,
      userMessage,
    };
  }

  return {
    ok: true,
    resent: payload?.resent === true,
    name: readInviteName(payload),
    inviteId: readInviteId(payload),
  };
}

/**
 * @param {Record<string, unknown> | null} payload
 * @returns {string}
 */
function readInviteName(payload) {
  if (typeof payload?.name === 'string' && payload.name.trim()) {
    return payload.name.trim();
  }
  const invite = payload?.invite;
  if (invite && typeof invite === 'object' && typeof invite.name === 'string') {
    return invite.name.trim();
  }
  return '';
}

/**
 * @param {Record<string, unknown> | null} payload
 * @returns {string | null}
 */
function readInviteId(payload) {
  if (typeof payload?.id === 'string' && payload.id.trim()) {
    return payload.id.trim();
  }
  const invite = payload?.invite;
  if (invite && typeof invite === 'object' && typeof invite.id === 'string' && invite.id.trim()) {
    return invite.id.trim();
  }
  return null;
}

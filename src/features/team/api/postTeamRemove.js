import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import { TEAM_MEMBER_NOT_FOUND } from '../constants/teamMembersCopy';

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
export function mapTeamRemoveHttpError(httpStatus, serverMessage) {
  const fallback = serverMessage?.trim() || null;
  if (httpStatus === 400) {
    return fallback || 'Could not remove this team member.';
  }
  if (httpStatus === 401) {
    return fallback || 'Sign in again to remove a team member.';
  }
  if (httpStatus === 403) {
    return fallback || 'Only the shop owner can remove team members.';
  }
  if (httpStatus === 404) {
    return fallback || TEAM_MEMBER_NOT_FOUND;
  }
  if (httpStatus >= 500) {
    return fallback || 'Couldn’t remove this team member. Try again in a moment.';
  }
  if (httpStatus === 0) {
    return fallback || 'Network error. Check your connection and try again.';
  }
  return fallback || `Couldn’t remove this team member (${httpStatus}).`;
}

/**
 * @param {unknown} source
 * @returns {'invite' | 'member' | null}
 */
export function normalizeTeamRemoveSource(source) {
  return source === 'invite' || source === 'member' ? source : null;
}

/**
 * Owner removes a pending invite or an active hire.
 * Server owns `removeTeamMember`. Do **not** update `business_members`,
 * `team_invites`, or `bookings` from the app. Do not send `businessId`.
 *
 * @param {string | null | undefined} accessToken
 * @param {{ id?: string | null; source?: string | null }} row list row (`id` + `source`)
 * @returns {Promise<
 *   | { ok: true }
 *   | { ok: false; error: Error; httpStatus: number; userMessage: string }
 * >}
 */
export async function postTeamRemove(accessToken, row) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return {
      ok: false,
      error: httpsErr,
      httpStatus: 0,
      userMessage: mapTeamRemoveHttpError(0, httpsErr.message),
    };
  }
  if (!accessToken) {
    return {
      ok: false,
      error: new Error('Not signed in'),
      httpStatus: 0,
      userMessage: mapTeamRemoveHttpError(401, null),
    };
  }

  const id = String(row?.id ?? '').trim();
  const source = normalizeTeamRemoveSource(row?.source);
  if (!id || !source) {
    return {
      ok: false,
      error: new Error('Missing id or source'),
      httpStatus: 0,
      userMessage: mapTeamRemoveHttpError(400, null),
    };
  }

  let res;
  try {
    res = await fetch(`${origin}/api/team/remove`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, source }),
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Network request failed');
    return {
      ok: false,
      error,
      httpStatus: 0,
      userMessage: mapTeamRemoveHttpError(0, error.message),
    };
  }

  let payload = /** @type {{ success?: boolean; error?: string } | null} */ (null);
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  const serverError = readServerErrorMessage(payload);
  if (!res.ok || payload?.success !== true) {
    const userMessage = mapTeamRemoveHttpError(res.status, serverError);
    return {
      ok: false,
      error: new Error(serverError || userMessage),
      httpStatus: res.status,
      userMessage,
    };
  }

  return { ok: true };
}

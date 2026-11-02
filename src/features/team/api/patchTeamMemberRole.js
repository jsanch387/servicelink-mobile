import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import { TEAM_MEMBER_NOT_FOUND } from '../constants/teamMembersCopy';
import { storedTeamRole } from '../constants/teamRoles';
import { normalizeTeamRemoveSource } from './postTeamRemove';

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
export function mapTeamRoleHttpError(httpStatus, serverMessage) {
  const fallback = serverMessage?.trim() || null;
  if (httpStatus === 400) {
    return fallback || 'Could not update this role.';
  }
  if (httpStatus === 401) {
    return fallback || 'Sign in again to update a team role.';
  }
  if (httpStatus === 403) {
    return fallback || 'Only the shop owner can change team roles.';
  }
  if (httpStatus === 404) {
    return fallback || TEAM_MEMBER_NOT_FOUND;
  }
  if (httpStatus >= 500) {
    return fallback || 'Couldn’t update this role. Try again in a moment.';
  }
  if (httpStatus === 0) {
    return fallback || 'Network error. Check your connection and try again.';
  }
  return fallback || `Couldn’t update this role (${httpStatus}).`;
}

/**
 * Owner changes a pending invite or an active hire's role.
 * Server writes `team_invites.role`, or `business_members.role` and the
 * accepted invite, so a later rejoin keeps the new role. Do not write those
 * tables from the app. Do not send `businessId`.
 *
 * @param {string | null | undefined} accessToken
 * @param {{ id?: string | null; source?: string | null; role?: string | null }} row
 * @returns {Promise<
 *   | { ok: true; role: 'member' | 'coordinator' | 'manager' }
 *   | { ok: false; error: Error; httpStatus: number; userMessage: string }
 * >}
 */
export async function patchTeamMemberRole(accessToken, row) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return {
      ok: false,
      error: httpsErr,
      httpStatus: 0,
      userMessage: mapTeamRoleHttpError(0, httpsErr.message),
    };
  }
  if (!accessToken) {
    return {
      ok: false,
      error: new Error('Not signed in'),
      httpStatus: 0,
      userMessage: mapTeamRoleHttpError(401, null),
    };
  }

  const id = String(row?.id ?? '').trim();
  const source = normalizeTeamRemoveSource(row?.source);
  const role = storedTeamRole(row?.role);
  if (!id || !source) {
    return {
      ok: false,
      error: new Error('Missing id or source'),
      httpStatus: 0,
      userMessage: mapTeamRoleHttpError(400, null),
    };
  }

  let res;
  try {
    res = await fetch(`${origin}/api/team/members`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, source, role }),
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Network request failed');
    return {
      ok: false,
      error,
      httpStatus: 0,
      userMessage: mapTeamRoleHttpError(0, error.message),
    };
  }

  let payload = /** @type {{ success?: boolean; role?: string; error?: string } | null} */ (null);
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  const serverError = readServerErrorMessage(payload);
  if (!res.ok || payload?.success !== true) {
    const userMessage = mapTeamRoleHttpError(res.status, serverError);
    return {
      ok: false,
      error: new Error(serverError || userMessage),
      httpStatus: res.status,
      userMessage,
    };
  }

  return { ok: true, role: storedTeamRole(payload?.role || role) };
}

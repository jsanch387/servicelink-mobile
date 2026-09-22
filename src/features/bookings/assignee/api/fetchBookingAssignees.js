import { productionWebApiHttpsGuard } from '../../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../../lib/stripeMobileCheckoutOrigin';
import { fetchBusinessProfileForUser } from '../../../home/api/homeDashboard';
import { mapBookingAssignees, mergeAssigneesKeepingFormer } from '../utils/mapBookingAssignees';
import { fetchAssigneeDirectoryForBusiness } from './fetchAssigneeDirectoryForBusiness';

/**
 * @param {string | null | undefined} accessToken
 * @param {{ userId?: string | null }} [options]
 * @returns {Promise<{ assignees: ReturnType<typeof mapBookingAssignees> }>}
 */
export async function fetchBookingAssignees(accessToken, options = {}) {
  const [fromApi, fromShop] = await Promise.all([
    fetchAssigneesFromApi(accessToken),
    fetchAssigneesFromSupabase(options.userId),
  ]);
  if (fromApi) {
    return {
      assignees: applyInviteNames(
        mergeAssigneesKeepingFormer(fromApi, fromShop.assignees),
        fromShop.assignees,
      ),
    };
  }
  return fromShop;
}

/**
 * Invite names win over email-only API labels.
 *
 * @param {ReturnType<typeof mapBookingAssignees>} primary
 * @param {ReturnType<typeof mapBookingAssignees>} named
 */
function applyInviteNames(primary, named) {
  const nameById = new Map();
  for (const row of named ?? []) {
    const label = String(row?.label ?? '').trim();
    if (row?.userId && label && !label.includes('@')) {
      nameById.set(row.userId, label);
    }
  }
  return (primary ?? []).map((row) => {
    const namedLabel = nameById.get(row.userId);
    return namedLabel ? { ...row, label: namedLabel } : row;
  });
}

async function fetchAssigneesFromApi(accessToken) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr || !accessToken) {
    return null;
  }

  let res;
  try {
    res = await fetch(`${origin}/api/availability/bookings/assignees`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    return null;
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || payload?.success !== true) {
    return null;
  }
  return mapBookingAssignees(payload);
}

async function fetchAssigneesFromSupabase(userId) {
  if (!userId) {
    return { assignees: [] };
  }

  const { data: shop, error: shopError } = await fetchBusinessProfileForUser(userId);
  if (shopError || !shop?.id || !shop.profile_id) {
    return { assignees: [] };
  }

  const directory = await fetchAssigneeDirectoryForBusiness(shop.id);
  return { assignees: directory.assignees };
}

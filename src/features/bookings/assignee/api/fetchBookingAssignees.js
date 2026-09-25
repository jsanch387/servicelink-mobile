import { productionWebApiHttpsGuard } from '../../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../../lib/stripeMobileCheckoutOrigin';
import { fetchBusinessProfileForUser } from '../../../home/api/homeDashboard';
import { isPlaceholderAssigneeLabel } from '../utils/buildAssigneesFromShopRoster';
import { mapBookingAssignees, mergeAssigneesKeepingFormer } from '../utils/mapBookingAssignees';
import { fetchAssigneeDirectoryForBusiness } from './fetchAssigneeDirectoryForBusiness';

/**
 * @param {string | null | undefined} accessToken
 * @param {{
 *   userId?: string | null;
 *   viewer?: { userId?: string | null; name?: string | null; email?: string | null } | null;
 * }} [options]
 * @returns {Promise<{ assignees: ReturnType<typeof mapBookingAssignees> }>}
 */
export async function fetchBookingAssignees(accessToken, options = {}) {
  const [fromApi, fromShop] = await Promise.all([
    fetchAssigneesFromApi(accessToken),
    fetchAssigneesFromSupabase(options.userId, options.viewer),
  ]);
  const assignees = fromApi
    ? applyInviteNames(mergeAssigneesKeepingFormer(fromApi, fromShop.assignees), fromShop.assignees)
    : (fromShop.assignees ?? []);
  return { assignees };
}

/**
 * Invite names win over email-only API labels.
 *
 * @param {ReturnType<typeof mapBookingAssignees>} primary
 * @param {ReturnType<typeof mapBookingAssignees>} named
 */
function applyInviteNames(primary, named) {
  const nameById = new Map();
  const shopById = new Map();
  for (const row of named ?? []) {
    if (row?.userId) {
      shopById.set(row.userId, row);
    }
    const label = String(row?.label ?? '').trim();
    if (row?.userId && label && !label.includes('@') && !isPlaceholderAssigneeLabel(label)) {
      nameById.set(row.userId, label);
    }
  }
  return (primary ?? []).map((row) => {
    const shopRow = shopById.get(row.userId);
    const namedLabel = nameById.get(row.userId);
    if (namedLabel) {
      return shopRow?.email
        ? { ...row, label: namedLabel, email: row.email || shopRow.email }
        : { ...row, label: namedLabel };
    }
    const shopLabel = String(shopRow?.label ?? '').trim();
    if (
      isPlaceholderAssigneeLabel(row.label) &&
      shopLabel &&
      !isPlaceholderAssigneeLabel(shopLabel)
    ) {
      return shopRow.email
        ? { ...row, label: shopLabel, email: row.email || shopRow.email }
        : { ...row, label: shopLabel };
    }
    return row;
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

async function fetchAssigneesFromSupabase(userId, viewer) {
  if (!userId) {
    return { assignees: [] };
  }

  const { data: shop, error: shopError } = await fetchBusinessProfileForUser(userId);
  if (shopError || !shop?.id || !shop.profile_id) {
    return { assignees: [] };
  }

  const directory = await fetchAssigneeDirectoryForBusiness(shop.id, viewer);
  return { assignees: directory.assignees };
}

import { can, permissionsForRole } from './rolePermissions';

/**
 * Shop capabilities. The owner passes every check. A hire is checked against
 * the permissions for their membership role.
 *
 * `canSeeOffice` is customers, quotes, invoices, expenses, reviews, the booking
 * page, services, hours, and marketing. Payments, billing, team, account
 * delete, and the owner home (earnings, link visits, plan usage) stay with the
 * owner.
 *
 * While the shop query is still settling, hide office UI so members do not
 * flash owner screens. Until a shop is known to belong to someone else,
 * owner-facing actions stay on.
 *
 * @param {{ id?: string | null; profile_id?: string | null } | null | undefined} shop
 * @param {string | null | undefined} userId
 * @param {{ shopReady?: boolean; membershipRole?: string | null }} [options]
 */
export function resolveShopCapabilities(shop, userId, options = {}) {
  const shopReady = options.shopReady !== false;
  const hasShop = Boolean(shop?.id);
  const isMember = Boolean(hasShop && shop.profile_id && userId && shop.profile_id !== userId);
  const isOwner = hasShop && !isMember;
  const hireCtx = {
    isOwner: false,
    permissions: permissionsForRole(options.membershipRole),
  };
  const ownerLike = shopReady && !isMember;
  const canSeeOffice = isMember ? shopReady && can(hireCtx, 'customers.read') : ownerLike;

  return {
    shop: shop ?? null,
    isOwner,
    isMember,
    canWriteBookings: isMember ? shopReady && can(hireCtx, 'bookings.write') : ownerLike,
    canDeleteBookings: isMember ? shopReady && can(hireCtx, 'bookings.delete') : ownerLike,
    canSeeOffice,
    canSeeOwnerHome: ownerLike,
    canManagePayments: ownerLike,
    canManageBilling: ownerLike,
    canManageTeam: shopReady && hasShop && !isMember,
    canDeleteAccount: shopReady && hasShop && !isMember,
  };
}

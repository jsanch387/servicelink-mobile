/**
 * Shop capabilities from ownership (`business_profiles.profile_id`), not `role`.
 * While the shop query is still settling, hide owner office UI so members do not
 * flash “Your business” / link visits / no-profile bookings.
 *
 * @param {{ id?: string | null; profile_id?: string | null } | null | undefined} shop
 * @param {string | null | undefined} userId
 * @param {{ shopReady?: boolean }} [options]
 */
export function resolveShopCapabilities(shop, userId, options = {}) {
  const shopReady = options.shopReady !== false;
  const hasShop = Boolean(shop?.id);
  const isMember = Boolean(hasShop && shop.profile_id && userId && shop.profile_id !== userId);

  return {
    shop: shop ?? null,
    isOwner: hasShop && !isMember,
    isMember,
    canWriteBookings: shopReady && !isMember,
    canSeeOffice: shopReady && !isMember,
    canManageTeam: shopReady && hasShop && !isMember,
    canDeleteAccount: shopReady && hasShop && !isMember,
  };
}

/**
 * Owners use their own plan. A hire with the office uses the shop's tools
 * instead of a subscribe card on their personal account.
 *
 * @param {{ hasProAccess?: boolean; isMember?: boolean; canSeeOffice?: boolean }} [params]
 * @returns {boolean}
 */
export function canUseShopTools({
  hasProAccess = false,
  isMember = false,
  canSeeOffice = false,
} = {}) {
  return Boolean(hasProAccess || (isMember && canSeeOffice));
}

/**
 * Who can open More → Team and invite.
 *
 * Team buyers stay on `subscription_tier = pro` and set `subscription_plan` to `team`.
 * Pro entitlement (active, trialing, or comped) is unchanged — a lapsed Team plan
 * loses Team the same way a lapsed Pro plan loses Pro.
 * Shops with `business_profiles.team_included` keep invites on their current price.
 *
 * @param {{
 *   subscriptionPlan?: unknown;
 *   hasProAccess?: boolean;
 *   teamIncluded?: boolean;
 * }} [params]
 * @returns {boolean}
 */
export function hasTeamPlanAccess({
  subscriptionPlan = null,
  hasProAccess = false,
  teamIncluded = false,
} = {}) {
  if (teamIncluded === true) {
    return true;
  }
  const plan = String(subscriptionPlan ?? '')
    .trim()
    .toLowerCase();
  return plan === 'team' && hasProAccess === true;
}

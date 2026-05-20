/** Max services a free-plan business can have in the catalog (expanded access: no app-side cap). */
export const FREE_TIER_MAX_SERVICES = 5;

/**
 * App Store–safe copy for the free-tier services cap (no "Upgrade" / pricing language).
 *
 * @param {number} [limit]
 */
export function freeTierServicesLimitCopy(limit = FREE_TIER_MAX_SERVICES) {
  return {
    alertTitle: 'Service limit reached',
    alertMessage: `You've reached the maximum of ${limit} services on your current access. To add more, sign in on the ServiceLink website with the same email you use in this app.`,
    inlineHint: `You've used all ${limit} services on your current access.`,
    inlineHintAction: 'Sign in on the web',
    sheetError: `You've reached the maximum of ${limit} services on your current access. Sign in on the web to add more.`,
  };
}

function normalizeTier(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function tierIsPro(tier) {
  return tier.includes('pro');
}

/**
 * Web parity: `isProAccess` (see web `src/features/pricing/utils/isProAccess.ts`).
 * Access is **not** derived from `subscription_current_period_end` — status + tier are SoT.
 *
 * @param {unknown} subscriptionTier
 * @param {unknown} _subscriptionCurrentPeriodEndUnused — kept for call-site stability; ignored
 * @param {unknown} subscriptionStatus
 * @param {unknown} stripeSubscriptionId
 * @param {unknown} stripeCustomerId
 * @returns {boolean}
 */
export function isProAccess(
  subscriptionTier,
  _subscriptionCurrentPeriodEndUnused,
  subscriptionStatus,
  stripeSubscriptionId,
  stripeCustomerId,
) {
  const tier = normalizeTier(subscriptionTier);
  const subId = String(stripeSubscriptionId ?? '').trim();
  const cusId = String(stripeCustomerId ?? '').trim();
  const statusRaw = String(subscriptionStatus ?? '').trim();
  const status = statusRaw.toLowerCase();

  if (tier === 'free' || tier === 'free_tier') {
    return false;
  }

  if (tierIsPro(tier) && !subId && !cusId) {
    return true;
  }

  if (subId) {
    if (!tierIsPro(tier)) {
      return false;
    }
    if (statusRaw === '') {
      return true;
    }
    return status === 'active' || status === 'trialing';
  }

  return false;
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 */
export function hasProAccessFromProfile(row) {
  return isProAccess(
    row?.subscription_tier ?? null,
    row?.subscription_current_period_end ?? null,
    row?.subscription_status ?? null,
    row?.stripe_subscription_id ?? null,
    row?.stripe_customer_id ?? null,
  );
}

const OWNER_PAYMENT_FAILED_STATUSES = new Set(['past_due', 'unpaid']);

/**
 * Billed owner whose card failed after they had been on Pro.
 * Stripe keeps `stripe_subscription_id` and marks the invoice `past_due` / `unpaid`.
 *
 * @param {Record<string, unknown> | null | undefined} row
 */
export function hasOwnerSubscriptionPaymentFailed(row) {
  const subId = String(row?.stripe_subscription_id ?? '').trim();
  if (!subId) {
    return false;
  }
  const status = String(row?.subscription_status ?? '')
    .trim()
    .toLowerCase();
  return OWNER_PAYMENT_FAILED_STATUSES.has(status);
}

/**
 * Stable key for one failed-invoice episode so dismiss survives relaunch
 * but a later failure can show the notice again.
 *
 * @param {Record<string, unknown> | null | undefined} row
 */
export function ownerPaymentFailedNoticeEpisodeKey(row) {
  if (!hasOwnerSubscriptionPaymentFailed(row)) {
    return '';
  }
  const subId = String(row?.stripe_subscription_id ?? '').trim();
  const status = String(row?.subscription_status ?? '')
    .trim()
    .toLowerCase();
  const periodEnd = String(row?.subscription_current_period_end ?? '').trim();
  return `${subId}:${status}:${periodEnd}`;
}

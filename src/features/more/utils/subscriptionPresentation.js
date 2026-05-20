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

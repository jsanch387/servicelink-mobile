/**
 * @param {unknown} value
 * @returns {Date | null}
 */
function parseProfileDate(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatLongDate(d) {
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function normalizeTier(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function tierIsPro(tier) {
  return tier.includes('pro');
}

/**
 * True when `profiles.subscription_tier` is the free product (`free` / `free_tier`).
 * Used by the full-screen upgrade gate: users returned to the free tier after cancel,
 * failed payment, or period end should use the main app with free limits — not be
 * blocked because Stripe customer / status fields are still populated.
 *
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {boolean}
 */
export function isExplicitFreeSubscriptionTier(row) {
  if (!row || typeof row !== 'object') return false;
  const tier = normalizeTier(row.subscription_tier);
  return tier === 'free' || tier === 'free_tier';
}

function nonEmpty(v) {
  return Boolean(String(v ?? '').trim());
}

/**
 * Web parity: `hasStripeBillingHistory` — any of customer id, subscription id, or subscription
 * status string means the user is not “legacy never-billed Free” for paywall purposes.
 *
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {boolean}
 */
export function hasStripeBillingHistoryFromProfile(row) {
  if (!row || typeof row !== 'object') return false;
  return (
    nonEmpty(row.stripe_customer_id) ||
    nonEmpty(row.stripe_subscription_id) ||
    nonEmpty(row.subscription_status)
  );
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

/**
 * @param {Record<string, unknown> | null | undefined} ownerRow
 * @returns {{ primary: string; period: string; isFreeTrial?: boolean } | null}
 */
export function getSubscriptionPriceDisplay(ownerRow) {
  if (!hasProAccessFromProfile(ownerRow)) return null;
  const status = String(ownerRow?.subscription_status ?? '')
    .trim()
    .toLowerCase();
  if (status === 'trialing') {
    return { primary: 'Free trial', period: '', isFreeTrial: true };
  }
  return { primary: '$10', period: '/month' };
}

/**
 * @param {Record<string, unknown> | null | undefined} ownerRow - `profiles` row
 */
export function getSubscriptionPlanLabel(ownerRow) {
  if (!hasProAccessFromProfile(ownerRow)) return 'Free';
  return 'Pro';
}

/**
 * Secondary line under the plan box (web parity).
 * @param {Record<string, unknown> | null | undefined} ownerRow
 * @returns {string | null}
 */
export function getSubscriptionAccessLine(ownerRow) {
  const hasPro = hasProAccessFromProfile(ownerRow);
  if (!hasPro || !ownerRow) return null;

  const status = String(ownerRow.subscription_status ?? '')
    .trim()
    .toLowerCase();
  const cancelAtPeriodEnd = ownerRow.subscription_cancel_at_period_end === true;
  const periodEnd = parseProfileDate(ownerRow.subscription_current_period_end);
  if (!periodEnd) return null;
  const dateLabel = formatLongDate(periodEnd);

  if (status === 'trialing') return `Trial ends on ${dateLabel}`;
  if (cancelAtPeriodEnd) return `Pro access until ${dateLabel}`;
  return `Renews on ${dateLabel}`;
}

/**
 * Badge next to "Subscription plan" (web parity): show only `Canceled` when
 * user still has Pro and cancel-at-period-end is set.
 * @param {Record<string, unknown> | null | undefined} ownerRow
 */
export function getSubscriptionHeaderBadge(ownerRow) {
  const hasPro = hasProAccessFromProfile(ownerRow);
  if (hasPro && ownerRow?.subscription_cancel_at_period_end === true) {
    return 'Canceled';
  }
  return null;
}

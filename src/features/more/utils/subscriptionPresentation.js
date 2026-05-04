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

/**
 * Web-parity call shape: `isProAccess(tier, periodEnd, status, subId, customerId)`.
 * @param {unknown} subscriptionTier
 * @param {unknown} subscriptionCurrentPeriodEnd
 * @param {unknown} subscriptionStatus
 * @param {unknown} stripeSubscriptionId
 * @param {unknown} stripeCustomerId
 * @returns {boolean}
 */
export function isProAccess(
  subscriptionTier,
  subscriptionCurrentPeriodEnd,
  subscriptionStatus,
  stripeSubscriptionId,
  stripeCustomerId,
) {
  const tier = String(subscriptionTier ?? '')
    .trim()
    .toLowerCase();
  if (tier.includes('pro')) return true;

  const status = String(subscriptionStatus ?? '')
    .trim()
    .toLowerCase();
  const hasStripeRefs =
    Boolean(String(stripeSubscriptionId ?? '').trim()) &&
    Boolean(String(stripeCustomerId ?? '').trim());
  if (!hasStripeRefs) return false;

  const periodEnd = parseProfileDate(subscriptionCurrentPeriodEnd);
  if (!periodEnd) return false;
  const hasTimeRemaining = periodEnd.getTime() > Date.now();
  if (!hasTimeRemaining) return false;

  return ['active', 'trialing', 'past_due', 'canceled', 'cancelled'].includes(status);
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
  const status = String(ownerRow?.subscription_status ?? '')
    .trim()
    .toLowerCase();
  if (status === 'trialing') return 'Pro trial';
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

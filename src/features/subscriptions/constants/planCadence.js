/** Cadence options for membership plans (maps to Stripe interval + interval_count later). */
export const PLAN_CADENCE_OPTIONS = [
  { key: 'every_2_weeks', label: 'Every 2 weeks', interval: 'week', intervalCount: 2 },
  { key: 'monthly', label: 'Every month', interval: 'month', intervalCount: 1 },
  { key: 'every_2_months', label: 'Every 2 months', interval: 'month', intervalCount: 2 },
  { key: 'every_3_months', label: 'Every 3 months', interval: 'month', intervalCount: 3 },
];

export const DEFAULT_PLAN_CADENCE_KEY = 'monthly';

export function getPlanCadenceOption(key) {
  return (
    PLAN_CADENCE_OPTIONS.find((row) => row.key === key) ??
    PLAN_CADENCE_OPTIONS.find((row) => row.key === DEFAULT_PLAN_CADENCE_KEY)
  );
}

export function formatCadenceLabel(cadenceKey) {
  return getPlanCadenceOption(cadenceKey)?.label ?? 'Every month';
}

/** Format membership price only, e.g. "$100" */
export function formatPlanPriceCents(cents) {
  const amount = Number(cents);
  if (!Number.isFinite(amount)) return '—';
  return (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 100 === 0 ? 0 : 2,
  });
}

/** Short price line for legacy single-cadence plans, e.g. "$100 · Every month" */
export function formatPlanPriceWithCadence(cents, cadenceKey) {
  return `${formatPlanPriceCents(cents)} · ${formatCadenceLabel(cadenceKey)}`;
}

/**
 * Plain-English list of how-often options the owner offers.
 * @param {string[] | null | undefined} cadenceKeys
 */
export function formatOfferedCadencesLabel(cadenceKeys) {
  const keys = Array.isArray(cadenceKeys) ? cadenceKeys.filter(Boolean) : [];
  if (keys.length === 0) return 'Customer picks how often';
  const labels = keys.map((key) => formatCadenceLabel(key));
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  if (labels.length === 3) return `${labels[0]}, ${labels[1]}, or ${labels[2]}`;
  return `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more`;
}

/**
 * @param {number} cents
 * @param {string[] | null | undefined} cadenceKeys
 */
export function formatPlanPriceWithOfferedCadences(cents, cadenceKeys) {
  return `${formatPlanPriceCents(cents)} · ${formatOfferedCadencesLabel(cadenceKeys)}`;
}

/** Interval units used for cadence labels (Stripe interval later). */
export const CADENCE_INTERVALS = [
  { key: 'week', label: 'week', labelPlural: 'weeks' },
  { key: 'month', label: 'month', labelPlural: 'months' },
];

/** Schedule options owners can offer on a plan (maps to Stripe interval + interval_count later). */
export const PLAN_CADENCE_OPTIONS = [
  { key: 'every_1_week', label: 'Every week', interval: 'week', intervalCount: 1 },
  { key: 'every_2_weeks', label: 'Every 2 weeks', interval: 'week', intervalCount: 2 },
  { key: 'monthly', label: 'Every month', interval: 'month', intervalCount: 1 },
  { key: 'every_2_months', label: 'Every 2 months', interval: 'month', intervalCount: 2 },
  { key: 'every_3_months', label: 'Every 3 months', interval: 'month', intervalCount: 3 },
];

export const DEFAULT_PLAN_CADENCE_KEY = 'monthly';

/**
 * One-tap chips in the plan sheet — the three schedules shops actually sell.
 * Anything else is reachable through the custom picker.
 */
export const PLAN_CADENCE_PRESETS = [
  { key: 'every_1_week', shortLabel: 'Weekly', count: 1, interval: /** @type {'week'} */ ('week') },
  {
    key: 'every_2_weeks',
    shortLabel: '2 weeks',
    count: 2,
    interval: /** @type {'week'} */ ('week'),
  },
  { key: 'monthly', shortLabel: 'Monthly', count: 1, interval: /** @type {'month'} */ ('month') },
];

export function isPresetCadence(count, interval) {
  const key = cadenceKeyFromParts(count, interval);
  return PLAN_CADENCE_PRESETS.some((preset) => preset.key === key);
}

/** Weeks stop at 4 because months take over from there; a year is the longest membership. */
export const CADENCE_MAX_COUNT = { week: 4, month: 12 };

export const DEFAULT_PLAN_CADENCE_PARTS = { count: 1, interval: 'month' };

/** Units the custom picker offers, with the numbers allowed for each. */
export const CADENCE_UNITS = [
  { key: /** @type {'week'} */ ('week'), label: 'Weeks' },
  { key: /** @type {'month'} */ ('month'), label: 'Months' },
];

/**
 * Numbers selectable for a unit: 1–4 weeks, 1–12 months.
 * Stripe caps a recurring interval at one year, so these are also its limits.
 * @returns {number[]}
 */
export function cadenceCountOptions(interval) {
  const max = CADENCE_MAX_COUNT[normalizeCadenceInterval(interval)];
  return Array.from({ length: max }, (_, i) => i + 1);
}

/** @returns {{ count: number; interval: 'week' | 'month' }} */
export function cadencePartsFromKey(cadenceKey) {
  const option = getPlanCadenceOption(cadenceKey);
  return {
    count: clampCadenceCount(option?.intervalCount, option?.interval),
    interval: normalizeCadenceInterval(option?.interval),
  };
}

/** @returns {'week' | 'month'} */
export function normalizeCadenceInterval(interval) {
  return interval === 'week' ? 'week' : 'month';
}

export function clampCadenceCount(count, interval) {
  const max = CADENCE_MAX_COUNT[normalizeCadenceInterval(interval)];
  const n = Math.round(Number(count)) || 1;
  return Math.min(max, Math.max(1, n));
}

/**
 * Stable key for a cadence, e.g. every_1_week, monthly, every_5_months.
 * @param {number} count
 * @param {'week' | 'month' | string} interval
 */
export function cadenceKeyFromParts(count, interval) {
  const unit = normalizeCadenceInterval(interval);
  const n = clampCadenceCount(count, unit);
  if (n === 1 && unit === 'month') return DEFAULT_PLAN_CADENCE_KEY;
  return `every_${n}_${unit}${n === 1 ? '' : 's'}`;
}

/**
 * @param {Array<{ count?: number; interval?: string }> | null | undefined} cadences
 * @returns {string[]} deduped keys, shortest schedule first
 */
export function cadenceKeysFromParts(cadences) {
  if (!Array.isArray(cadences) || cadences.length === 0) return [DEFAULT_PLAN_CADENCE_KEY];
  const keys = cadences
    .filter(Boolean)
    .map((row) => cadenceKeyFromParts(row?.count, row?.interval));
  const unique = sortCadenceKeys(Array.from(new Set(keys)));
  return unique.length > 0 ? unique : [DEFAULT_PLAN_CADENCE_KEY];
}

/** Approximate days between charges — used only for ordering. */
export function cadenceSortValue(cadenceKey) {
  const option = getPlanCadenceOption(cadenceKey);
  const count = Number(option?.intervalCount) || 1;
  return option?.interval === 'week' ? count * 7 : count * 30;
}

/**
 * @param {string[] | null | undefined} cadenceKeys
 * @returns {string[]}
 */
export function sortCadenceKeys(cadenceKeys) {
  const keys = Array.isArray(cadenceKeys) ? cadenceKeys.filter(Boolean) : [];
  return [...keys].sort((a, b) => cadenceSortValue(a) - cadenceSortValue(b));
}

export function getPlanCadenceOption(key) {
  const exact = PLAN_CADENCE_OPTIONS.find((row) => row.key === key);
  if (exact) return exact;

  const match = /^every_(\d+)_(week|month)s?$/.exec(String(key ?? ''));
  if (match) {
    const intervalCount = Number(match[1]);
    const interval = match[2];
    return {
      key: String(key),
      label: formatCustomCadenceLabel(intervalCount, interval),
      interval,
      intervalCount,
    };
  }

  return PLAN_CADENCE_OPTIONS.find((row) => row.key === DEFAULT_PLAN_CADENCE_KEY);
}

/** Wheel row label, e.g. "1 week", "3 weeks", "12 months". */
export function formatCadenceCountLabel(count, interval) {
  const unit = normalizeCadenceInterval(interval);
  const n = clampCadenceCount(count, unit);
  const intervalData = CADENCE_INTERVALS.find((row) => row.key === unit);
  return `${n} ${n === 1 ? intervalData.label : intervalData.labelPlural}`;
}

/** Format a custom cadence from interval + count */
export function formatCustomCadenceLabel(intervalCount, interval) {
  const count = Number(intervalCount);
  if (!count || count < 1) return 'Every month';

  const intervalData = CADENCE_INTERVALS.find((i) => i.key === interval);
  if (!intervalData) return 'Every month';

  if (count === 1) {
    return `Every ${intervalData.label}`;
  }
  return `Every ${count} ${intervalData.labelPlural}`;
}

export function formatCadenceLabel(cadenceKey) {
  return getPlanCadenceOption(cadenceKey)?.label ?? 'Every month';
}

/**
 * Compact pill label for hub cards: Weekly, 2 weeks, Monthly, 3 months.
 * @param {number} count
 * @param {'week' | 'month' | string} interval
 */
export function formatCadencePillLabel(count, interval) {
  const unit = normalizeCadenceInterval(interval);
  const n = clampCadenceCount(count, unit);
  const preset = PLAN_CADENCE_PRESETS.find((row) => row.count === n && row.interval === unit);
  if (preset) return preset.shortLabel;
  const intervalData = CADENCE_INTERVALS.find((row) => row.key === unit);
  return `${n} ${n === 1 ? intervalData.label : intervalData.labelPlural}`;
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

/** Charges per year for a cadence — weekly is 52, not 48, so months never divide evenly. */
export function chargesPerYear(count, interval) {
  const n = clampCadenceCount(count, interval);
  return normalizeCadenceInterval(interval) === 'week' ? 52 / n : 12 / n;
}

/**
 * What a schedule costs per month, rounded to whole dollars.
 * Keeps "$45 every week" from reading as "$45 a month".
 * @returns {number | null} cents, or null when the cadence is already monthly
 */
export function monthlyEquivalentCents(priceCents, count, interval) {
  const amount = Number(priceCents);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (cadenceKeyFromParts(count, interval) === DEFAULT_PLAN_CADENCE_KEY) return null;
  const perMonth = (amount * chargesPerYear(count, interval)) / 12;
  return Math.round(perMonth / 100) * 100;
}

/** e.g. "About $195 a month" — null when the schedule is already monthly. */
export function formatMonthlyEquivalentLabel(priceCents, count, interval) {
  const cents = monthlyEquivalentCents(priceCents, count, interval);
  if (cents == null) return null;
  return `About ${formatPlanPriceCents(cents)} a month`;
}

/**
 * Plain sentence under a schedule, e.g. "Charged every week · about $195 a month".
 * Spells the cadence out so the short chip labels can stay short.
 */
export function formatScheduleSummary(priceCents, count, interval) {
  const cadence = formatCustomCadenceLabel(count, interval).toLowerCase();
  const monthly = monthlyEquivalentCents(priceCents, count, interval);
  const base = `Charged ${cadence}`;
  if (monthly == null) return base;
  return `${base} · about ${formatPlanPriceCents(monthly)} a month`;
}

/** List row subtitle, e.g. "$20 a week" / "$45 every 2 weeks". */
export function formatSchedulePriceLine(priceCents, count, interval) {
  const amount = Number(priceCents);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  const unit = normalizeCadenceInterval(interval);
  const n = clampCadenceCount(count, unit);
  const price = formatPlanPriceCents(amount);
  if (n === 1) {
    const intervalData = CADENCE_INTERVALS.find((row) => row.key === unit);
    return `${price} a ${intervalData.label}`;
  }
  return `${price} ${formatCustomCadenceLabel(n, unit).toLowerCase()}`;
}

/**
 * Cheapest schedule on a plan, for list cards.
 * @param {Array<{ priceCents?: number }> | null | undefined} schedules
 */
export function lowestSchedulePriceCents(schedules) {
  const amounts = (Array.isArray(schedules) ? schedules : [])
    .map((row) => Number(row?.priceCents))
    .filter((n) => Number.isFinite(n) && n > 0);
  return amounts.length > 0 ? Math.min(...amounts) : null;
}

/**
 * Schedules ordered shortest cadence first, so lists read weekly → monthly.
 * @param {Array<{ cadenceKey?: string }> | null | undefined} schedules
 */
export function sortSchedules(schedules) {
  const rows = Array.isArray(schedules) ? schedules.filter(Boolean) : [];
  return [...rows].sort(
    (a, b) => cadenceSortValue(a?.cadenceKey) - cadenceSortValue(b?.cadenceKey),
  );
}

/**
 * Price summary for a plan card: "$100" for one schedule, "from $45" for several.
 * @param {Array<{ priceCents?: number }> | null | undefined} schedules
 */
export function formatPlanPriceSummary(schedules) {
  const parts = planPriceSummaryParts(schedules);
  if (!parts) return '—';
  return parts.prefix ? `${parts.prefix} ${parts.amount}` : parts.amount;
}

/**
 * Split price for styled cards: `{ prefix: 'from', amount: '$20' }` or `{ prefix: null, amount: '$100' }`.
 * @param {Array<{ priceCents?: number }> | null | undefined} schedules
 * @returns {{ prefix: string | null; amount: string } | null}
 */
export function planPriceSummaryParts(schedules) {
  const rows = Array.isArray(schedules) ? schedules : [];
  const lowest = lowestSchedulePriceCents(rows);
  if (lowest == null) return null;
  return {
    prefix: rows.length > 1 ? 'from' : null,
    amount: formatPlanPriceCents(lowest),
  };
}

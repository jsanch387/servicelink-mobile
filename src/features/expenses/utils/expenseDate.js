import { parseLocalYyyyMmDd, startOfLocalDay } from '../../../components/ui';

/**
 * List-row day label — `Today`, `Yesterday`, or `Tue, Sep 8`.
 *
 * @param {string | null | undefined} yyyyMmDd
 * @param {number} [nowMs]
 */
export function formatExpenseDayLabel(yyyyMmDd, nowMs = Date.now()) {
  const date = parseLocalYyyyMmDd(yyyyMmDd);
  if (!date) return '';
  const today = startOfLocalDay(new Date(nowMs));
  const day = startOfLocalDay(date);
  const dayDiff = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (dayDiff === 0) return 'Today';
  if (dayDiff === 1) return 'Tomorrow';
  if (dayDiff === -1) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Form field date — `Friday, September 8, 2026`.
 *
 * @param {string | null | undefined} yyyyMmDd
 */
export function formatExpenseDateFieldLabel(yyyyMmDd) {
  const date = parseLocalYyyyMmDd(yyyyMmDd);
  if (!date) return '';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Month section header — `September`.
 *
 * @param {string | null | undefined} yyyyMm
 */
export function formatExpenseMonthLabel(yyyyMm) {
  const raw = String(yyyyMm ?? '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})$/);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const date = new Date(year, month, 1);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'long' });
}

/**
 * @param {string | null | undefined} yyyyMmDd
 */
export function expenseMonthKey(yyyyMmDd) {
  const raw = String(yyyyMmDd ?? '').trim();
  return raw.length >= 7 ? raw.slice(0, 7) : '';
}

/**
 * Newest month first; newest day first within a month.
 *
 * @param {Array<{ chargedOn?: string }>} expenses
 * @returns {Array<{ monthKey: string; expenses: typeof expenses }>}
 */
export function groupExpensesByMonth(expenses) {
  const groups = new Map();
  for (const item of expenses ?? []) {
    const key = expenseMonthKey(item?.chargedOn);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, items]) => ({
      monthKey,
      expenses: [...items].sort((a, b) => {
        const dateCmp = String(b?.chargedOn ?? '').localeCompare(String(a?.chargedOn ?? ''));
        if (dateCmp !== 0) return dateCmp;
        return String(a?.name ?? '').localeCompare(String(b?.name ?? ''));
      }),
    }));
}

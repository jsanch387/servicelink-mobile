/**
 * Draft schedule helpers for plan create/edit sheets.
 */
import { isPresetCadence, normalizeCadenceInterval, sortSchedules } from '../constants/planCadence';

function priceTextFromCents(cents) {
  const n = Math.max(0, Number(cents) || 0) / 100;
  if (!Number.isFinite(n)) return '';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Map live plan schedules into PlanScheduleField draft rows.
 * @param {unknown} offered
 */
export function planSchedulesToEditorValue(offered) {
  return sortSchedules(offered).map((row) => {
    const interval = normalizeCadenceInterval(row.interval);
    const count = Math.max(1, Math.round(Number(row.count)) || 1);
    return {
      count,
      interval,
      priceText: priceTextFromCents(row.priceCents),
      custom: !isPresetCadence(count, interval),
    };
  });
}

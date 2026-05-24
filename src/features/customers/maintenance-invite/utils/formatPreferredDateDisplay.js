import { isValidCalendarYyyyMmDd } from '../../../quotes/utils/formatScheduledDateDisplay';

/**
 * @param {string | null | undefined} yyyyMmDd
 * @returns {string}
 */
export function formatPreferredDateMmDdYyyy(yyyyMmDd) {
  const s = String(yyyyMmDd ?? '').trim();
  if (!isValidCalendarYyyyMmDd(s)) {
    return '';
  }
  const [y, mo, d] = s.split('-');
  return `${mo}/${d}/${y}`;
}

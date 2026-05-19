/** Local calendar date (no time / UTC shift) for picker keys and comparisons. */

export function toLocalYyyyMmDd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalYyyyMmDd(key) {
  if (!key || typeof key !== 'string') return null;
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

export function startOfLocalDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Standard month grid: Sun–Sat rows with `null` padding cells (no adjacent-month dates).
 *
 * @param {number} year full year
 * @param {number} month 0-indexed (0 = January)
 * @returns {(Date | null)[][]}
 */
export function buildMonthWeekGrid(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = new Date(year, month, 1).getDay();
  const weeks = [];

  let week = Array(7).fill(null);
  let day = 1;

  for (let col = startPad; col < 7 && day <= daysInMonth; col += 1) {
    week[col] = new Date(year, month, day);
    day += 1;
  }
  weeks.push(week);

  while (day <= daysInMonth) {
    week = Array(7).fill(null);
    for (let col = 0; col < 7 && day <= daysInMonth; col += 1) {
      week[col] = new Date(year, month, day);
      day += 1;
    }
    weeks.push(week);
  }

  return weeks;
}

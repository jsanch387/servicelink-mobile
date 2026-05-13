import { localYyyyMmDd } from '../../home/utils/bookingStart';

/**
 * @param {string} yyyyMmDd - Postgres date string e.g. "2026-03-31"
 * @param {Date} [nowForRelativeLabels] - defaults to `new Date()`; used for "Today" / "Tomorrow" only
 * @returns {string} e.g. "Today", "Tomorrow", or "Monday, March 31" (year when not same calendar year as `nowForRelativeLabels`)
 */
export function formatBookingSectionTitle(yyyyMmDd, nowForRelativeLabels = new Date()) {
  const raw = String(yyyyMmDd).slice(0, 10);
  const [y, m, d] = raw.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) {
    return raw;
  }

  const ref = nowForRelativeLabels;
  const todayKey = localYyyyMmDd(ref);
  const tomorrowD = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1);
  const tomorrowKey = localYyyyMmDd(tomorrowD);

  if (raw === todayKey) {
    return 'Today';
  }
  if (raw === tomorrowKey) {
    return 'Tomorrow';
  }

  const date = new Date(y, m - 1, d);
  const sameYear = date.getFullYear() === ref.getFullYear();
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/**
 * Buckets bookings by `scheduled_date` (calendar day). Preserves input order within each day
 * (caller should pass rows already sorted soonest-first).
 *
 * @param {Array<{ id: string; scheduled_date: string }>} bookings
 * @returns {{ title: string; dateKey: string; data: typeof bookings }[]}
 */
export function groupBookingsByScheduledDate(bookings) {
  if (!bookings?.length) {
    return [];
  }
  /** @type {Map<string, typeof bookings>} */
  const map = new Map();
  /** @type {string[]} */
  const order = [];

  for (const b of bookings) {
    const dateKey = String(b.scheduled_date).slice(0, 10);
    if (!map.has(dateKey)) {
      map.set(dateKey, []);
      order.push(dateKey);
    }
    map.get(dateKey).push(b);
  }

  return order.map((dateKey) => ({
    title: formatBookingSectionTitle(dateKey),
    dateKey,
    data: map.get(dateKey),
  }));
}

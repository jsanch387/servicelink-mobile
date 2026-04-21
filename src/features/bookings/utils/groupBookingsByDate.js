/**
 * @param {string} yyyyMmDd - Postgres date string e.g. "2026-03-31"
 * @returns {string} e.g. "Monday, March 31" or includes year when not the current calendar year
 */
export function formatBookingSectionTitle(yyyyMmDd) {
  const raw = String(yyyyMmDd).slice(0, 10);
  const [y, m, d] = raw.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) {
    return raw;
  }
  const date = new Date(y, m - 1, d);
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
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

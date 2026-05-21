/**
 * @param {import('../api/bookings').BookingRow[] | null | undefined} rows
 * @returns {Record<string, import('../api/bookings').BookingRow[]>}
 */
export function indexBookingsByScheduledDate(rows) {
  /** @type {Record<string, import('../api/bookings').BookingRow[]>} */
  const byDate = {};
  for (const row of rows ?? []) {
    const key = row?.scheduled_date;
    if (!key || typeof key !== 'string') {
      continue;
    }
    if (!byDate[key]) {
      byDate[key] = [];
    }
    byDate[key].push(row);
  }
  return byDate;
}

/**
 * @param {{ scheduled_date?: string | null }[] | null | undefined} rows
 * @returns {Record<string, number>}
 */
export function bookingCountsFromScheduledRows(rows) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const row of rows ?? []) {
    const key = row?.scheduled_date;
    if (!key || typeof key !== 'string') {
      continue;
    }
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/**
 * @param {Record<string, import('../api/bookings').BookingRow[]>} byDate
 * @returns {Record<string, number>}
 */
export function bookingCountsByDateKey(byDate) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const [key, list] of Object.entries(byDate)) {
    counts[key] = list.length;
  }
  return counts;
}

/**
 * @param {Record<string, import('../api/bookings').BookingRow[]>} byDate
 * @param {string} dateKey
 * @returns {import('../api/bookings').BookingRow[]}
 */
export function bookingsForDateKey(byDate, dateKey) {
  return byDate[dateKey] ?? [];
}

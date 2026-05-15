/**
 * Prefer `business_profiles.free_bookings_count` when the server provides it;
 * otherwise use the bookings head-count query (`useBookingsFreeTierUsage`).
 *
 * @param {{ free_bookings_count?: unknown } | null | undefined} business
 * @param {number | undefined} headCountUsed
 * @returns {number | undefined}
 */
export function resolveFreeTierBookingUsed(business, headCountUsed) {
  const v = business?.free_bookings_count;
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v;
  }
  return headCountUsed;
}

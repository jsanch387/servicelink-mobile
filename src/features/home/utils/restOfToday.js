import { getBookingServiceLabelParts } from '../../bookings/utils/formatBookingServiceLabel';
import { getBookingStatusVisualKind } from '../../bookings/utils/bookingStatusVisual';

/**
 * @typedef {'scheduled' | 'completed' | 'cancelled'} RestOfTodayStatusKind
 */

/**
 * Convert bookings rows into UI timeline items (full day: upcoming, completed, canceled).
 *
 * @param {object[] | null | undefined} rows
 * @returns {{
 *   id: string;
 *   time: string;
 *   title: string;
 *   extraCount: number;
 *   statusKind: RestOfTodayStatusKind;
 * }[]}
 */
export function mapBookingsToRestOfTodayItems(rows) {
  return (rows ?? []).map((row) => {
    const time = new Date(`${row.scheduled_date}T${row.start_time}`).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    const statusKind = getBookingStatusVisualKind(row?.status);
    const { primary, extraCount } = getBookingServiceLabelParts(row);
    return {
      id: row.id,
      time,
      title: primary,
      extraCount,
      statusKind,
    };
  });
}

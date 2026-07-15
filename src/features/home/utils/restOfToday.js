import { getBookingStatusVisualKind } from '../../bookings/utils/bookingStatusVisual';
import { splitBookingServiceName } from '../../../utils/splitBookingServiceName';

/**
 * @typedef {'scheduled' | 'completed' | 'cancelled'} RestOfTodayStatusKind
 */

/**
 * Convert bookings rows into UI timeline items (full day: upcoming, completed, canceled).
 *
 * @param {object[] | null | undefined} rows
 * @returns {{ id: string; time: string; title: string; statusKind: RestOfTodayStatusKind }[]}
 */
export function mapBookingsToRestOfTodayItems(rows) {
  return (rows ?? []).map((row) => {
    const time = new Date(`${row.scheduled_date}T${row.start_time}`).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    const statusKind = getBookingStatusVisualKind(row?.status);
    const serviceName = splitBookingServiceName(row.service_name).primary;
    return {
      id: row.id,
      time,
      title: serviceName,
      statusKind,
    };
  });
}

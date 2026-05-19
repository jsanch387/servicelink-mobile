import { startOfLocalDay, toLocalYyyyMmDd } from '../../../../components/ui/calendarDateKey';
import { BOOKING_CALENDAR_MAX_DAYS_AHEAD } from '../constants';

/**
 * Local calendar bounds for booking UIs and blocking-booking queries.
 */
export function getBookingCalendarRange(now = new Date()) {
  const minDate = startOfLocalDay(now);
  const maxDate = startOfLocalDay(now);
  maxDate.setDate(maxDate.getDate() + BOOKING_CALENDAR_MAX_DAYS_AHEAD);
  return {
    minDate,
    maxDate,
    rangeFrom: toLocalYyyyMmDd(minDate),
    rangeTo: toLocalYyyyMmDd(maxDate),
  };
}

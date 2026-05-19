import { BookingDateTimePicker } from '../../../availability/booking';

/**
 * Create-appointment schedule step — thin wrapper around shared {@link BookingDateTimePicker}.
 */
export function ScheduleStep(props) {
  return <BookingDateTimePicker {...props} />;
}

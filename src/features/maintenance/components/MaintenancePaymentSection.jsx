import { BookingPaymentSection } from '../../bookings/booking-details/components/BookingPaymentSection';

/**
 * @param {object} props
 * @param {import('../utils/buildMaintenancePaymentSection').MaintenancePaymentModel} props.payment
 */
export function MaintenancePaymentSection({ payment }) {
  return <BookingPaymentSection payment={payment} />;
}

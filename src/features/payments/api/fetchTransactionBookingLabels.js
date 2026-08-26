import { supabase } from '../../../lib/supabase';
import { getBookingServiceLabelParts } from '../../bookings/utils/formatBookingServiceLabel';
import { isGenericMultiJobTitle } from '../utils/splitPaymentsTransactionTitle';

function labelFromBooking(row) {
  const parts = getBookingServiceLabelParts(row);
  const serviceName =
    !parts.primary || parts.primary === 'Service' || isGenericMultiJobTitle(parts.primary)
      ? ''
      : parts.primary;
  return { serviceName, extraCount: parts.extraCount };
}

export function localBookingPaymentId(transactionId) {
  const match = String(transactionId ?? '').match(/^local_bp_(.+)$/);
  return match ? match[1] : '';
}

/**
 * First service + extra job count for rows whose painted title is “Mixed/Double jobs”.
 *
 * @param {{ bookingIds?: string[]; paymentIds?: string[] }} [args]
 * @returns {Promise<Record<string, { serviceName: string; extraCount: number }>>}
 */
export async function fetchTransactionBookingLabels(args = {}) {
  const bookingIds = [
    ...new Set((args.bookingIds ?? []).map((id) => String(id ?? '').trim()).filter(Boolean)),
  ];
  const paymentIds = [
    ...new Set((args.paymentIds ?? []).map((id) => String(id ?? '').trim()).filter(Boolean)),
  ];
  if (bookingIds.length === 0 && paymentIds.length === 0) {
    return {};
  }

  /** @type {Record<string, { serviceName: string; extraCount: number }>} */
  const map = {};

  if (bookingIds.length > 0) {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, service_name, job_details, visit_job_count')
      .in('id', bookingIds);
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const id = String(row?.id ?? '').trim();
        if (!id) continue;
        map[id] = labelFromBooking(row);
      }
    }
  }

  if (paymentIds.length > 0) {
    const { data, error } = await supabase
      .from('booking_payments')
      .select('id, bookings(id, service_name, job_details, visit_job_count)')
      .in('id', paymentIds);
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const payId = String(row?.id ?? '').trim();
        const booking = Array.isArray(row?.bookings) ? row.bookings[0] : row?.bookings;
        if (!payId || !booking) continue;
        const label = labelFromBooking(booking);
        map[`local_bp_${payId}`] = label;
        const bookingId = String(booking.id ?? '').trim();
        if (bookingId) map[bookingId] = label;
      }
    }
  }

  return map;
}

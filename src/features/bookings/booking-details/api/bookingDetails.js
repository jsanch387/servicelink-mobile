import { supabase } from '../../../../lib/supabase';

export const BOOKING_DETAILS_SELECT = [
  'id',
  'status',
  'scheduled_date',
  'start_time',
  'duration_minutes',
  'service_name',
  'service_price_cents',
  'addon_details',
  'customer_name',
  'customer_phone',
  'customer_email',
  'customer_street_address',
  'customer_unit_apt',
  'customer_city',
  'customer_state',
  'customer_zip',
  'customer_vehicle_year',
  'customer_vehicle_make',
  'customer_vehicle_model',
  'customer_notes',
].join(', ');

/**
 * @param {string} bookingId
 */
export async function fetchBookingDetailsById(bookingId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_DETAILS_SELECT)
    .eq('id', bookingId)
    .maybeSingle();

  return { data, error };
}

/**
 * @param {string} bookingId
 */
export async function markBookingCompletedById(bookingId) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)
    .select('id, status')
    .maybeSingle();

  return { data, error };
}

/**
 * @param {string} bookingId
 */
export async function cancelBookingById(bookingId) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select('id, status')
    .maybeSingle();

  return { data, error };
}

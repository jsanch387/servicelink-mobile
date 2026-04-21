import { supabase } from '../../../lib/supabase';
import { localYyyyMmDd } from '../utils/bookingStart';

/**
 * Fetch confirmed bookings scheduled for the current local day.
 *
 * @param {string} businessId
 * @returns {Promise<{ data: object[] | null, error: Error | null }>}
 */
export async function fetchConfirmedBookingsForToday(businessId) {
  const today = localYyyyMmDd();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, scheduled_date, start_time, service_name, customer_vehicle_year, customer_vehicle_make, customer_vehicle_model',
    )
    .eq('business_id', businessId)
    .eq('status', 'confirmed')
    .eq('scheduled_date', today)
    .order('start_time', { ascending: true });

  return { data, error };
}

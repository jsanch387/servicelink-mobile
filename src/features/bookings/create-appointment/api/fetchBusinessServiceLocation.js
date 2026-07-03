import { supabase } from '../../../../lib/supabase';
import { serviceLocationFromProfile } from '../../../bookingLink/utils/bookingLinkBookingSettings';

/**
 * Loads where the business works (mobile / shop / both) and shop address fields for create appointment.
 *
 * @param {string | null | undefined} businessId
 */
export async function fetchBusinessServiceLocation(businessId) {
  const id = String(businessId ?? '').trim();
  if (!id) {
    return { data: null, error: new Error('Missing business') };
  }

  const { data, error } = await supabase
    .from('business_profiles')
    .select('service_location_mode, shop_street_address, shop_unit, service_area, business_zip')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message ?? 'Could not load business location') };
  }

  return { data: serviceLocationFromProfile(data ?? {}), error: null };
}

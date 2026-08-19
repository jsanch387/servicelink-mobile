import { supabase } from '../../../../lib/supabase';

const LOCATION_VEHICLE_SELECT = [
  'customer_street_address',
  'customer_unit_apt',
  'customer_city',
  'customer_state',
  'customer_zip',
  'customer_vehicle_year',
  'customer_vehicle_make',
  'customer_vehicle_model',
  'job_details',
].join(', ');

/**
 * Address + vehicle from a subscription-linked booking
 * (typically `customer_memberships.initial_booking_id`).
 *
 * @param {string} businessId
 * @param {string} bookingId
 * @returns {Promise<{
 *   address: { street: string; unit: string; city: string; state: string; zip: string } | null;
 *   vehicle: { year: string; make: string; model: string } | null;
 *   error: Error | null;
 * }>}
 */
export async function fetchBookingPlaceById(businessId, bookingId) {
  const bid = String(businessId ?? '').trim();
  const id = String(bookingId ?? '').trim();
  if (!bid || !id) {
    return { address: null, vehicle: null, error: null };
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(LOCATION_VEHICLE_SELECT)
    .eq('business_id', bid)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { address: null, vehicle: null, error };
  }
  if (!data) {
    return { address: null, vehicle: null, error: null };
  }

  const street = String(data.customer_street_address ?? '').trim();
  const city = String(data.customer_city ?? '').trim();
  const state = String(data.customer_state ?? '')
    .trim()
    .toUpperCase();
  const zip = String(data.customer_zip ?? '').trim();
  const address =
    street || city || state || zip
      ? {
          street,
          unit: String(data.customer_unit_apt ?? '').trim(),
          city,
          state,
          zip,
        }
      : null;

  let year = String(data.customer_vehicle_year ?? '').trim();
  let make = String(data.customer_vehicle_make ?? '').trim();
  let model = String(data.customer_vehicle_model ?? '').trim();

  if (!year && !make && !model && data.job_details) {
    const jobs = Array.isArray(data.job_details)
      ? data.job_details
      : typeof data.job_details === 'object' && Array.isArray(data.job_details?.jobs)
        ? data.job_details.jobs
        : [];
    const first = jobs[0];
    const v = first?.vehicle ?? first?.Vehicle ?? null;
    if (v && typeof v === 'object') {
      year = String(v.year ?? '').trim();
      make = String(v.make ?? '').trim();
      model = String(v.model ?? '').trim();
    }
  }

  const vehicle = year || make || model ? { year, make, model } : null;

  return { address, vehicle, error: null };
}

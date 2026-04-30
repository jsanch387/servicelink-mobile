import { supabase } from '../../../../lib/supabase';
import { normalizePhoneForDatabase } from '../../../../utils/phone';
import { upsertCustomerForBooking } from './upsertCustomerForBooking';

/**
 * Owner-created confirmed booking (mirrors web: CRM upsert, then booking snapshot + `customer_id`).
 *
 * @param {object} payload
 * @returns {Promise<{ data: { id: string } | null; error: Error | null }>}
 */
export async function insertOwnerBooking(payload) {
  const {
    businessId,
    businessSlug,
    serviceId,
    serviceName,
    servicePriceCents,
    addonDetails,
    durationMinutes,
    scheduledDate,
    startTimeHhMmSs,
    customerName,
    customerEmail,
    customerPhoneDigits,
    street,
    unit,
    city,
    state,
    zip,
    vehicleYear,
    vehicleMake,
    vehicleModel,
  } = payload;

  const { data: customerRow, error: customerError } = await upsertCustomerForBooking(businessId, {
    fullName: customerName,
    email: customerEmail,
    phone: customerPhoneDigits,
  });

  if (customerError || !customerRow?.id) {
    return { data: null, error: customerError ?? new Error('Could not save customer') };
  }

  const row = {
    business_id: businessId,
    business_slug: businessSlug?.trim() || null,
    customer_id: customerRow.id,
    service_id: serviceId ?? null,
    service_name: serviceName.trim(),
    service_price_cents: servicePriceCents,
    addon_details: addonDetails ?? null,
    duration_minutes: durationMinutes,
    scheduled_date: scheduledDate,
    start_time: startTimeHhMmSs,
    status: 'confirmed',
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhoneDigits,
    customer_street_address: street,
    customer_unit_apt: unit || null,
    customer_city: city,
    customer_state: state,
    customer_zip: zip,
    customer_vehicle_year: vehicleYear || null,
    customer_vehicle_make: vehicleMake || null,
    customer_vehicle_model: vehicleModel || null,
  };

  const { data, error } = await supabase.from('bookings').insert(row).select('id').maybeSingle();

  return { data, error: error ?? null };
}

/**
 * @param {string} time12h e.g. "8:00 AM"
 * @returns {string} "HH:mm:ss"
 */
export function startTimeToSqlTime(time12h) {
  const raw = String(time12h ?? '').trim();
  if (!raw) return '09:00:00';
  const m = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return '09:00:00';
  let h = Number(m[1]);
  const min = m[2];
  const ap = m[3].toUpperCase();
  if (ap === 'AM' && h === 12) h = 0;
  if (ap === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${min}:00`;
}

export function bookingCustomerPhoneDigits(phoneUi) {
  return normalizePhoneForDatabase(phoneUi) ?? '';
}

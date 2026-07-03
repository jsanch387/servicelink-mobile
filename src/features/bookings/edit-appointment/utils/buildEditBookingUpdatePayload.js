import {
  buildAddonDetailsPayload,
  buildServiceDisplayName,
} from '../../create-appointment/utils/buildOwnerBookingPayload';
import { appointmentLocationTypeForApi } from '../../create-appointment/utils/createAppointmentServiceLocation';
import {
  bookingCustomerPhoneDigits,
  startTimeToSqlTime,
} from '../../create-appointment/utils/ownerBookingFieldFormats';

/**
 * Maps edit-wizard form state to a `bookings` row update (snake_case columns).
 * Direct Supabase update only — no emails or server side effects.
 *
 * @param {object} args
 * @param {unknown} args.selectedService
 * @param {string | null} args.selectedServiceId
 * @param {unknown} args.selectedPricingOption
 * @param {unknown[]} args.selectedAddonRows
 * @param {number} args.totalDurationMinutes
 * @param {string | null} args.selectedDateKey
 * @param {string | null} args.selectedTime
 * @param {{ fullName: string; email?: string; phone: string }} args.customer
 * @param {{ street: string; unit?: string; city: string; state: string; zip: string }} args.address
 * @param {{ year: string; make: string; model: string }} args.vehicle
 * @param {string} [args.notes]
 * @param {'mobile' | 'shop' | null} [args.appointmentLocationType]
 */
export function buildEditBookingUpdatePayload({
  selectedService,
  selectedServiceId,
  selectedPricingOption,
  selectedAddonRows,
  totalDurationMinutes,
  selectedDateKey,
  selectedTime,
  customer,
  address,
  vehicle,
  notes,
  appointmentLocationType,
}) {
  const notesTrimmed = typeof notes === 'string' ? notes.trim() : '';
  const serviceId = selectedServiceId != null ? String(selectedServiceId).trim() : '';

  return {
    scheduled_date: selectedDateKey,
    start_time: startTimeToSqlTime(selectedTime),
    duration_minutes: totalDurationMinutes,
    service_id: serviceId || null,
    service_name: buildServiceDisplayName(selectedService, selectedPricingOption),
    service_price_cents: selectedPricingOption?.priceCents ?? 0,
    addon_details: buildAddonDetailsPayload(selectedAddonRows),
    customer_name: customer.fullName.trim(),
    customer_email: String(customer.email ?? '').trim(),
    customer_phone: bookingCustomerPhoneDigits(customer.phone),
    customer_street_address: address.street.trim(),
    customer_unit_apt: String(address.unit ?? '').trim(),
    customer_city: address.city.trim(),
    customer_state: String(address.state ?? '')
      .trim()
      .toUpperCase()
      .slice(0, 2),
    customer_zip: address.zip.trim(),
    customer_vehicle_year: String(vehicle.year ?? '').trim(),
    customer_vehicle_make: String(vehicle.make ?? '').trim(),
    customer_vehicle_model: String(vehicle.model ?? '').trim(),
    customer_notes: notesTrimmed,
    service_location_type: appointmentLocationTypeForApi(appointmentLocationType),
  };
}

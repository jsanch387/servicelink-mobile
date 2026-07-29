import {
  buildAddonDetailsPayload,
  buildOwnerManualJobItem,
  buildServiceDisplayName,
} from '../../create-appointment/utils/buildOwnerBookingPayload';
import { appointmentLocationTypeForApi } from '../../create-appointment/utils/createAppointmentServiceLocation';
import {
  bookingCustomerPhoneDigits,
  startTimeToSqlTime,
} from '../../create-appointment/utils/ownerBookingFieldFormats';
import { sumEditJobsDurationMinutes } from './mapBookingJobsForEdit';

/**
 * Visit rollup for legacy columns / Complete `job_completed` amount-due
 * (`service_price_cents` + `addon_details`), which still may not sum `job_details`.
 *
 * @param {Array<object>} jobs
 * @returns {{ servicePriceCents: number; addonRows: unknown[] }}
 */
function sumMultiJobLegacyPricing(jobs) {
  let servicePriceCents = 0;
  /** @type {unknown[]} */
  const addonRows = [];
  for (const job of jobs) {
    servicePriceCents += Math.max(
      0,
      Math.round(Number(job?.selectedPricingOption?.priceCents) || 0),
    );
    const rows = Array.isArray(job?.selectedAddonRows) ? job.selectedAddonRows : [];
    for (const row of rows) {
      addonRows.push(row);
    }
  }
  return { servicePriceCents, addonRows };
}

/**
 * Maps edit-wizard form state to a `bookings` row update (snake_case columns).
 * Direct Supabase update only — no emails or server side effects.
 *
 * Multi-job: writes `job_details` + `visit_job_count`, duration = sum of jobs,
 * top-level service name/vehicle from the first job, and visit-total
 * `service_price_cents` / flattened `addon_details` for Complete amount-due.
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
 * @param {boolean} [args.isMultiJob]
 * @param {Array<object>} [args.jobs] edit job snapshots when `isMultiJob`
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
  isMultiJob = false,
  jobs = null,
}) {
  const notesTrimmed = typeof notes === 'string' ? notes.trim() : '';

  /** @type {Record<string, unknown>} */
  const visitFields = {
    scheduled_date: selectedDateKey,
    start_time: startTimeToSqlTime(selectedTime),
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
    customer_notes: notesTrimmed,
    service_location_type: appointmentLocationTypeForApi(appointmentLocationType),
  };

  if (isMultiJob && Array.isArray(jobs) && jobs.length > 1) {
    const jobItems = jobs.map((job) => buildOwnerManualJobItem(job));
    const first = jobs[0];
    const firstVehicle = first?.vehicle ?? {};
    const firstServiceName =
      String(first?.serviceName ?? '').trim() ||
      buildServiceDisplayName({ name: first?.serviceName }, first?.selectedPricingOption);
    const firstServiceId =
      first?.selectedServiceId != null && String(first.selectedServiceId).trim()
        ? String(first.selectedServiceId).trim()
        : null;
    const { servicePriceCents, addonRows } = sumMultiJobLegacyPricing(jobs);

    return {
      ...visitFields,
      duration_minutes: sumEditJobsDurationMinutes(jobs),
      job_details: jobItems,
      visit_job_count: jobs.length,
      service_id: firstServiceId,
      service_name: buildServiceDisplayName(
        { name: firstServiceName },
        first?.selectedPricingOption,
      ),
      service_price_cents: servicePriceCents,
      addon_details: buildAddonDetailsPayload(addonRows),
      customer_vehicle_year: String(firstVehicle.year ?? '').trim(),
      customer_vehicle_make: String(firstVehicle.make ?? '').trim(),
      customer_vehicle_model: String(firstVehicle.model ?? '').trim(),
    };
  }

  const serviceId = selectedServiceId != null ? String(selectedServiceId).trim() : '';

  return {
    ...visitFields,
    duration_minutes: totalDurationMinutes,
    service_id: serviceId || null,
    service_name: buildServiceDisplayName(selectedService, selectedPricingOption),
    service_price_cents: selectedPricingOption?.priceCents ?? 0,
    addon_details: buildAddonDetailsPayload(selectedAddonRows),
    customer_vehicle_year: String(vehicle.year ?? '').trim(),
    customer_vehicle_make: String(vehicle.make ?? '').trim(),
    customer_vehicle_model: String(vehicle.model ?? '').trim(),
  };
}

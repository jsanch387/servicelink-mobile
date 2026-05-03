import { bookingCustomerPhoneDigits, startTimeToSqlTime } from '../api/insertOwnerBooking';
import { parsePriceLabelToUsd } from './priceLabelMath';

/**
 * @param {{ name?: string | null } | null | undefined} selectedService
 * @param {{ label?: string | null; priceCents?: number | null } | null | undefined} selectedPricingOption
 */
export function buildServiceDisplayName(selectedService, selectedPricingOption) {
  const serviceNameBase = selectedService?.name?.trim() || 'Service';
  const tierLabel = selectedPricingOption?.label;
  if (tierLabel && tierLabel !== 'Standard') {
    return `${serviceNameBase} — ${tierLabel}`;
  }
  return serviceNameBase;
}

/**
 * @param {Array<{ id: unknown; name?: string; priceLabel?: string; durationMinutes?: number | null }>} selectedAddonRows
 */
export function buildAddonDetailsPayload(selectedAddonRows) {
  if (!selectedAddonRows?.length) return null;
  return {
    addons: selectedAddonRows.map((a) => ({
      id: a.id,
      name: a.name,
      priceCents: Math.round(parsePriceLabelToUsd(a.priceLabel) * 100),
      durationMinutes: a.durationMinutes ?? 0,
    })),
  };
}

/**
 * Maps wizard state to {@link insertOwnerBooking} payload (pure — easy to unit test).
 *
 * @param {object} args
 * @param {{ businessId: string | null; businessSlug?: string | null }} args.catalog
 * @param {unknown} args.selectedService
 * @param {string | null} args.selectedServiceId
 * @param {unknown} args.selectedPricingOption
 * @param {unknown[]} args.selectedAddonRows
 * @param {number} args.totalDurationMinutes
 * @param {string | null} args.selectedDateKey
 * @param {string | null} args.selectedTime
 * @param {{ fullName: string; email: string; phone: string }} args.customer
 * @param {{ street: string; unit?: string; city: string; state: string; zip: string }} args.address
 * @param {{ year: string; make: string; model: string }} args.vehicle
 * @param {string} [args.notes] trimmed into `bookings.customer_notes`
 */
export function buildOwnerBookingInsertPayload({
  catalog,
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
}) {
  const notesTrimmed = typeof notes === 'string' ? notes.trim() : '';
  return {
    businessId: catalog.businessId,
    businessSlug: catalog.businessSlug,
    serviceId: selectedServiceId,
    serviceName: buildServiceDisplayName(selectedService, selectedPricingOption),
    servicePriceCents: selectedPricingOption?.priceCents ?? 0,
    addonDetails: buildAddonDetailsPayload(selectedAddonRows),
    durationMinutes: totalDurationMinutes,
    scheduledDate: selectedDateKey,
    startTimeHhMmSs: startTimeToSqlTime(selectedTime),
    customerName: customer.fullName.trim(),
    customerEmail: customer.email.trim(),
    customerPhoneDigits: bookingCustomerPhoneDigits(customer.phone),
    street: address.street.trim(),
    unit: address.unit?.trim() ?? '',
    city: address.city.trim(),
    state: address.state.trim(),
    zip: address.zip.trim(),
    vehicleYear: vehicle.year.trim(),
    vehicleMake: vehicle.make.trim(),
    vehicleModel: vehicle.model.trim(),
    customerNotes: notesTrimmed,
  };
}

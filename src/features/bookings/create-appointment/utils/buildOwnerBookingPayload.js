import { bookingCustomerPhoneDigits, startTime12hToApiStartTime } from './ownerBookingFieldFormats';
import { appointmentLocationTypeForApi } from './createAppointmentServiceLocation';
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
 * Maps selected add-ons to `selectedAddOns` on `POST /api/public/bookings`.
 * @param {Array<{ id: unknown; name?: string; priceLabel?: string; durationMinutes?: number | null }>} selectedAddonRows
 * @returns {Array<{ id: string; name: string; priceCents: number; durationMinutes: number }>}
 */
export function buildSelectedAddOnsForPublicApi(selectedAddonRows) {
  if (!selectedAddonRows?.length) return [];
  return selectedAddonRows.map((a) => ({
    id: String(a.id),
    name: String(a.name ?? '').trim() || 'Add-on',
    priceCents: Math.round(parsePriceLabelToUsd(a.priceLabel) * 100),
    durationMinutes: a.durationMinutes ?? 0,
  }));
}

/**
 * JSON body for {@link postOwnerManualPublicBooking} — mirrors web owner confirm (`ownerManualBooking: true`).
 * Do not insert `bookings` from the client for this flow; the server enforces email, payments row, caps, and time-off.
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
 * @param {{ fullName: string; email?: string; phone: string }} args.customer
 * @param {{ street: string; unit?: string; city: string; state: string; zip: string }} args.address
 * @param {{ year: string; make: string; model: string }} args.vehicle
 * @param {string} [args.notes]
 * @param {'mobile' | 'shop' | null} [args.appointmentLocationType]
 */
export function buildOwnerManualPublicBookingBody({
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
  appointmentLocationType,
}) {
  const notesTrimmed = typeof notes === 'string' ? notes.trim() : '';
  const tierRaw =
    selectedPricingOption?.label != null ? String(selectedPricingOption.label).trim() : '';
  const optionLabel = tierRaw && tierRaw !== 'Standard' ? tierRaw : null;
  const baseServiceName = selectedService?.name?.trim() || 'Service';

  /** @type {Record<string, unknown>} */
  const body = {
    businessSlug: String(catalog.businessSlug ?? '').trim(),
    businessId: String(catalog.businessId ?? '').trim(),
    serviceName: baseServiceName,
    servicePriceCents: selectedPricingOption?.priceCents ?? 0,
    selectedAddOns: buildSelectedAddOnsForPublicApi(selectedAddonRows),
    durationMinutes: totalDurationMinutes,
    scheduledDate: selectedDateKey,
    startTime: startTime12hToApiStartTime(selectedTime),
    paymentMethodSelected: 'none',
    ownerManualBooking: true,
    serviceLocationType: appointmentLocationTypeForApi(appointmentLocationType),
    customer: {
      fullName: customer.fullName.trim(),
      email: String(customer.email ?? '').trim(),
      phone: bookingCustomerPhoneDigits(customer.phone),
      streetAddress: address.street.trim(),
      unitApt: String(address.unit ?? '').trim(),
      city: address.city.trim(),
      state: String(address.state ?? '')
        .trim()
        .toUpperCase()
        .slice(0, 2),
      zip: address.zip.trim(),
      vehicleYear: String(vehicle.year ?? '').trim(),
      vehicleMake: String(vehicle.make ?? '').trim(),
      vehicleModel: String(vehicle.model ?? '').trim(),
      notes: notesTrimmed,
    },
  };

  const sid = selectedServiceId != null ? String(selectedServiceId).trim() : '';
  if (sid) {
    body.serviceId = sid;
  }
  if (optionLabel) {
    body.servicePriceOptionLabel = optionLabel;
  }

  return body;
}

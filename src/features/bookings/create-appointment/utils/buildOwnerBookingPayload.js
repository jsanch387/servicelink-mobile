import { bookingCustomerPhoneDigits, startTime12hToApiStartTime } from './ownerBookingFieldFormats';
import { appointmentLocationTypeForApi } from './createAppointmentServiceLocation';
import { isCreateFlowBasePricingId } from './createFlowPricing';
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
 * @param {Array<{ id: unknown; name?: string; priceCents?: number; priceLabel?: string; durationMinutes?: number | null }>} selectedAddonRows
 */
export function buildAddonDetailsPayload(selectedAddonRows) {
  if (!selectedAddonRows?.length) return null;
  return {
    addons: selectedAddonRows.map((a) => ({
      id: a.id,
      name: a.name,
      priceCents:
        a.priceCents != null && Number.isFinite(Number(a.priceCents))
          ? Math.max(0, Math.round(Number(a.priceCents)))
          : Math.round(parsePriceLabelToUsd(a.priceLabel) * 100),
      durationMinutes: a.durationMinutes ?? 0,
    })),
  };
}

/**
 * Maps selected add-ons to `selectedAddOns` on `POST /api/public/bookings`.
 * @param {Array<{ id: unknown; name?: string; priceCents?: number; priceLabel?: string; durationMinutes?: number | null }>} selectedAddonRows
 * @returns {Array<{ id: string; name: string; priceCents: number; durationMinutes: number }>}
 */
export function buildSelectedAddOnsForPublicApi(selectedAddonRows) {
  if (!selectedAddonRows?.length) return [];
  return selectedAddonRows.map((a) => ({
    id: String(a.id),
    name: String(a.name ?? '').trim() || 'Add-on',
    priceCents:
      a.priceCents != null && Number.isFinite(Number(a.priceCents))
        ? Math.max(0, Math.round(Number(a.priceCents)))
        : Math.round(parsePriceLabelToUsd(a.priceLabel) * 100),
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
 * @param {{
 *   sale: { id: string };
 *   subtotalCents: number;
 *   discountCents: number;
 *   discountLabel: string;
 *   discountType: string | null;
 *   discountValue: number | null;
 * } | null} [args.appliedSaleDiscount]
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
  appliedSaleDiscount = null,
}) {
  const notesTrimmed = typeof notes === 'string' ? notes.trim() : '';
  const tierRaw =
    selectedPricingOption?.label != null ? String(selectedPricingOption.label).trim() : '';
  const isBasePrice =
    isCreateFlowBasePricingId(selectedPricingOption?.id, selectedServiceId) ||
    (!selectedPricingOption?.id && tierRaw === 'Standard');
  const optionLabel = tierRaw && !isBasePrice ? tierRaw : null;
  const baseServiceName = selectedService?.name?.trim() || 'Service';
  const selectedAddOns = buildSelectedAddOnsForPublicApi(selectedAddonRows);
  const servicePriceCents = Math.max(0, Math.round(Number(selectedPricingOption?.priceCents) || 0));

  /** @type {Record<string, unknown>} */
  const body = {
    businessSlug: String(catalog.businessSlug ?? '').trim(),
    businessId: String(catalog.businessId ?? '').trim(),
    serviceName: baseServiceName,
    servicePriceCents,
    durationMinutes: Math.max(1, Math.round(Number(totalDurationMinutes) || 0)),
    scheduledDate: selectedDateKey,
    startTime: startTime12hToApiStartTime(selectedTime),
    paymentMethodSelected: 'none',
    ownerManualBooking: true,
    serviceLocationType: appointmentLocationTypeForApi(appointmentLocationType),
    customer: {
      fullName: customer.fullName.trim().slice(0, 120),
      email: String(customer.email ?? '')
        .trim()
        .slice(0, 254),
      phone: bookingCustomerPhoneDigits(customer.phone),
      streetAddress: address.street.trim().slice(0, 200),
      unitApt: String(address.unit ?? '')
        .trim()
        .slice(0, 50),
      city: address.city.trim().slice(0, 100),
      state: String(address.state ?? '')
        .trim()
        .toUpperCase()
        .slice(0, 2),
      zip: address.zip.trim().slice(0, 5),
      vehicleYear: String(vehicle.year ?? '').trim(),
      vehicleMake: String(vehicle.make ?? '').trim(),
      vehicleModel: String(vehicle.model ?? '').trim(),
      notes: notesTrimmed.slice(0, 280),
    },
  };

  const sid = selectedServiceId != null ? String(selectedServiceId).trim() : '';
  if (sid) {
    body.serviceId = sid;
  }
  if (selectedAddOns.length > 0 || sid) {
    body.selectedAddOns = selectedAddOns;
  }
  if (optionLabel) {
    body.servicePriceOptionLabel = optionLabel;
  }

  if (
    appliedSaleDiscount &&
    appliedSaleDiscount.sale?.id &&
    appliedSaleDiscount.discountCents > 0
  ) {
    body.discountSource = 'sale';
    body.discountSaleId = String(appliedSaleDiscount.sale.id);
    body.discountType = appliedSaleDiscount.discountType;
    body.discountValue = appliedSaleDiscount.discountValue;
    body.subtotalCents = appliedSaleDiscount.subtotalCents;
    body.discountCents = appliedSaleDiscount.discountCents;
    body.discountLabel = appliedSaleDiscount.discountLabel;
  }

  return body;
}

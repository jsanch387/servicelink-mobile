import { normalizeBookingVehicle } from '../../../../utils/vehicle';
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
 * Maps selected add-ons to `selectedAddOns` on a job in `POST /api/public/bookings`.
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
 * @param {{ year?: string; make?: string; model?: string } | null | undefined} vehicle
 * @returns {{ year: string; make: string; model: string }}
 */
export function buildJobVehicleForPublicApi(vehicle) {
  return normalizeBookingVehicle(vehicle);
}

/**
 * One `jobs[]` item for owner multi-job create.
 *
 * @param {object} job
 * @param {string | null | undefined} job.selectedServiceId
 * @param {boolean} [job.isCustomJob]
 * @param {string} [job.serviceName]
 * @param {{
 *   id?: string;
 *   label?: string | null;
 *   priceCents?: number | null;
 * } | null} [job.selectedPricingOption]
 * @param {unknown[]} [job.selectedAddonRows]
 * @param {number} [job.totalDurationMinutes]
 * @param {{ year?: string; make?: string; model?: string } | null} [job.vehicle]
 * @param {string} [job.localId]
 * @returns {Record<string, unknown>}
 */
export function buildOwnerManualJobItem(job) {
  const isCustom = Boolean(job.isCustomJob) || !String(job.selectedServiceId ?? '').trim();
  const sid = !isCustom ? String(job.selectedServiceId ?? '').trim() : '';
  const pricing = job.selectedPricingOption ?? null;
  const tierRaw = pricing?.label != null ? String(pricing.label).trim() : '';
  const isBasePrice =
    isCreateFlowBasePricingId(pricing?.id, sid || null) || (!pricing?.id && tierRaw === 'Standard');
  const optionLabel = !isCustom && tierRaw && !isBasePrice ? tierRaw : null;
  const selectedAddOns = isCustom ? [] : buildSelectedAddOnsForPublicApi(job.selectedAddonRows);

  /** @type {Record<string, unknown>} */
  const item = {
    serviceName: String(job.serviceName ?? '').trim() || 'Service',
    servicePriceCents: Math.max(0, Math.round(Number(pricing?.priceCents) || 0)),
    durationMinutes: Math.max(1, Math.round(Number(job.totalDurationMinutes) || 0)),
    vehicle: buildJobVehicleForPublicApi(job.vehicle),
  };

  if (sid) {
    item.serviceId = sid;
  }
  if (optionLabel) {
    item.servicePriceOptionLabel = optionLabel;
  }
  if (!isCustom && selectedAddOns.length > 0) {
    item.selectedAddOns = selectedAddOns;
  }

  const clientJobId = String(job.localId ?? '').trim();
  if (clientJobId) {
    item.clientJobId = clientJobId;
  }

  return item;
}

/**
 * JSON body for {@link postOwnerManualPublicBooking} — appointment + `jobs[]`
 * (`ownerManualBooking: true`). One booking row on the server; jobs live in `job_details`.
 *
 * Do not insert `bookings` from the client for this flow.
 *
 * @param {object} args
 * @param {{ businessId: string | null; businessSlug?: string | null }} args.catalog
 * @param {string | null} args.selectedDateKey
 * @param {string | null} args.selectedTime
 * @param {{ fullName: string; email?: string; phone: string }} args.customer
 * @param {{ street: string; unit?: string; city: string; state: string; zip: string }} args.address
 * @param {string} [args.notes]
 * @param {'mobile' | 'shop' | null} [args.appointmentLocationType]
 * @param {Array<object>} args.jobs - committed + active job snapshots ({@link buildOwnerManualJobItem})
 * @param {{
 *   sale: { id: string };
 *   subtotalCents: number;
 *   discountCents: number;
 *   discountLabel: string;
 *   discountType: string | null;
 *   discountValue: number | null;
 * } | null} [args.availableSaleDiscount] - qualifying sale preview for the appointment date
 * @param {boolean} [args.applySaleDiscount] - owner opt-in on Review; server applies sale only when true
 * @param {string | null} [args.membershipId] - when set, period-visit link on server + membership payment
 */
export function buildOwnerManualPublicBookingBody({
  catalog,
  selectedDateKey,
  selectedTime,
  customer,
  address,
  notes,
  appointmentLocationType,
  jobs,
  availableSaleDiscount = null,
  applySaleDiscount = false,
  membershipId = null,
}) {
  const notesTrimmed = typeof notes === 'string' ? notes.trim() : '';
  const jobItems = (jobs ?? []).map((job) => buildOwnerManualJobItem(job));
  const membershipIdTrimmed = String(membershipId ?? '').trim();
  const isMembershipVisit = Boolean(membershipIdTrimmed);

  /** @type {Record<string, unknown>} */
  const body = {
    businessSlug: String(catalog.businessSlug ?? '').trim(),
    businessId: String(catalog.businessId ?? '').trim(),
    scheduledDate: selectedDateKey,
    startTime: startTime12hToApiStartTime(selectedTime),
    paymentMethodSelected: isMembershipVisit ? 'membership' : 'none',
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
      notes: notesTrimmed.slice(0, 280),
    },
    jobs: jobItems,
  };

  if (isMembershipVisit) {
    body.membershipId = membershipIdTrimmed;
    body.applySale = false;
  }

  const saleAvailable =
    !isMembershipVisit &&
    Boolean(availableSaleDiscount?.sale?.id) &&
    (availableSaleDiscount?.discountCents ?? 0) > 0;
  if (saleAvailable) {
    body.applySaleDiscount = Boolean(applySaleDiscount);
    if (applySaleDiscount) {
      body.discountSource = 'sale';
      body.discountSaleId = String(availableSaleDiscount.sale.id);
      body.discountType = availableSaleDiscount.discountType;
      body.discountValue = availableSaleDiscount.discountValue;
      body.subtotalCents = availableSaleDiscount.subtotalCents;
      body.discountCents = availableSaleDiscount.discountCents;
      body.discountLabel = availableSaleDiscount.discountLabel;
    }
  }

  return body;
}

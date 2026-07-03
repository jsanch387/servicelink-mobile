import { format24HourTo12Hour } from '../../../availability/utils/availabilityModel';
import { calendarYyyyMmDdFromScheduledDate } from '../../../home/utils/bookingStart';
import { splitBookingServiceName } from '../../../../utils/splitBookingServiceName';
import { bookingCustomerPhoneDigits } from '../../create-appointment/utils/ownerBookingFieldFormats';
import {
  CREATE_APPOINTMENT_LOCATION_MOBILE,
  CREATE_APPOINTMENT_LOCATION_SHOP,
  getDefaultAppointmentLocationType,
} from '../../create-appointment/utils/createAppointmentServiceLocation';
import {
  buildCreateFlowPricingOptions,
  createFlowBasePricingId,
  isServicePriceTiersEnabled,
} from '../../create-appointment/utils/createFlowPricing';
import { catalogAddonsForService } from '../../../services/utils/catalogAddonsForService';
import {
  createEmptyAddressForm,
  createEmptyCustomerForm,
  createEmptyVehicleForm,
} from '../constants';

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeBookingAddonItems(addonDetails) {
  if (!addonDetails) {
    return [];
  }
  const parsed = typeof addonDetails === 'string' ? safeJsonParse(addonDetails) : addonDetails;
  if (!parsed) {
    return [];
  }
  const sourceItems = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.items)
      ? parsed.items
      : Array.isArray(parsed.addons)
        ? parsed.addons
        : [];

  return sourceItems
    .map((item, idx) => {
      const id = String(item?.id ?? item?.addon_id ?? '').trim();
      const name =
        String(item?.name ?? item?.label ?? item?.title ?? '').trim() || `Add-on ${idx + 1}`;
      return { id, name };
    })
    .filter((item) => item.id || item.name);
}

/**
 * @param {Array<{ id: string; name?: string }>} catalogAddonsForService
 * @param {unknown} addonDetails raw booking `addon_details`
 * @returns {string[]} catalog add-on ids to preselect in the edit wizard
 */
export function resolveEditAppointmentAddonIds({ booking, catalogAddonsForService }) {
  const bookingItems = normalizeBookingAddonItems(booking?.addon_details);
  const available = catalogAddonsForService ?? [];
  if (!bookingItems.length || !available.length) {
    return [];
  }

  const resolved = [];
  for (const item of bookingItems) {
    const idStr = String(item.id ?? '').trim();
    let match = idStr.length > 0 ? available.find((a) => String(a.id) === idStr) : null;

    if (!match && item.name) {
      const target = normalizePricingLabel(item.name);
      match = available.find((a) => normalizePricingLabel(a.name) === target);
      if (!match) {
        match = available.find((a) => {
          const catalogName = normalizePricingLabel(a.name);
          return catalogName.includes(target) || target.includes(catalogName);
        });
      }
    }

    if (match) {
      resolved.push(String(match.id));
    }
  }

  return [...new Set(resolved)];
}

/** @param {unknown} addonDetails */
export function bookingHasAddonDetails(addonDetails) {
  return normalizeBookingAddonItems(addonDetails).length > 0;
}

function pickServiceRow(catalog, serviceId) {
  const rows = catalog?.serviceRows ?? [];
  return rows.find((r) => String(r.id) === String(serviceId)) ?? null;
}

/**
 * @param {Array<{ id: string | number; name?: string }>} services
 * @param {string} serviceNamePrimary
 */
export function matchCatalogServiceIdByName(services, serviceNamePrimary) {
  const target = String(serviceNamePrimary ?? '')
    .trim()
    .toLowerCase();
  if (!target) {
    return null;
  }
  const match = (services ?? []).find(
    (s) =>
      String(s?.name ?? '')
        .trim()
        .toLowerCase() === target,
  );
  return match?.id != null ? String(match.id) : null;
}

function addressFormFromBooking(booking) {
  return {
    street: String(booking?.customer_street_address ?? '').trim(),
    unit: String(booking?.customer_unit_apt ?? '').trim(),
    city: String(booking?.customer_city ?? '').trim(),
    state: String(booking?.customer_state ?? '').trim(),
    zip: String(booking?.customer_zip ?? '').trim(),
  };
}

function addressesMatch(a, b) {
  const norm = (value) =>
    String(value ?? '')
      .trim()
      .toLowerCase();
  return (
    norm(a.street) === norm(b.street) &&
    norm(a.unit) === norm(b.unit) &&
    norm(a.city) === norm(b.city) &&
    norm(a.state) === norm(b.state) &&
    norm(a.zip) === norm(b.zip)
  );
}

/**
 * @param {object} booking
 * @param {ReturnType<typeof addressFormFromBusinessShopLocation>} shopAddressForm
 * @param {string | null | undefined} businessServiceMode
 */
export function inferEditAppointmentLocationType(booking, shopAddressForm, businessServiceMode) {
  const bookingAddress = addressFormFromBooking(booking);
  const hasCustomerAddress = Boolean(
    bookingAddress.street || bookingAddress.city || bookingAddress.zip,
  );

  if (!hasCustomerAddress) {
    return (
      getDefaultAppointmentLocationType(businessServiceMode) ?? CREATE_APPOINTMENT_LOCATION_SHOP
    );
  }

  if (addressesMatch(bookingAddress, shopAddressForm)) {
    return CREATE_APPOINTMENT_LOCATION_SHOP;
  }

  return CREATE_APPOINTMENT_LOCATION_MOBILE;
}

/**
 * @param {string | null | undefined} startTime Postgres `time` e.g. "10:00:00"
 * @returns {string | null} 12-hour label e.g. "10:00 AM"
 */
export function bookingStartTimeToScheduleLabel(startTime) {
  const raw = String(startTime ?? '').trim();
  if (!raw) {
    return null;
  }
  const hhmm = raw.replace(/\.\d+/, '').slice(0, 5);
  if (!/^\d{1,2}:\d{2}$/.test(hhmm)) {
    return null;
  }
  return format24HourTo12Hour(hhmm);
}

function normalizePricingLabel(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function pricingLabelsMatch(bookingLabel, optionLabel) {
  const left = normalizePricingLabel(bookingLabel);
  const right = normalizePricingLabel(optionLabel);
  if (!left || !right) {
    return false;
  }
  if (left === right) {
    return true;
  }
  return left.includes(right) || right.includes(left);
}

/**
 * @param {object} args
 * @param {Record<string, unknown>} args.booking
 * @param {object} args.catalog
 * @param {boolean} args.ownerHasPro
 * @param {Record<string, unknown>[]} args.priceOptionRows
 * @param {string | null | undefined} args.serviceId
 */
export function resolveEditAppointmentPricingId({
  booking,
  catalog,
  ownerHasPro,
  priceOptionRows,
  serviceId,
}) {
  const sid = serviceId != null ? String(serviceId).trim() : '';
  if (!sid || !booking) {
    return null;
  }

  const serviceRow = pickServiceRow(catalog, sid);
  const pricingPayload = buildCreateFlowPricingOptions(
    serviceRow,
    priceOptionRows ?? [],
    ownerHasPro,
  );
  const options = pricingPayload.options;
  if (!options.length) {
    return null;
  }

  const { pricingOption: pricingOptionLabel } = splitBookingServiceName(booking.service_name);
  const labelMatch = pricingOptionLabel
    ? options.find((o) => pricingLabelsMatch(pricingOptionLabel, o.label))
    : null;

  const cents = Number(booking.service_price_cents);
  const centsMatches =
    Number.isFinite(cents) && cents >= 0 ? options.filter((o) => o.priceCents === cents) : [];

  if (labelMatch) {
    return labelMatch.id;
  }
  if (centsMatches.length === 1) {
    return centsMatches[0].id;
  }
  if (!pricingOptionLabel && centsMatches.length > 1) {
    const standard = centsMatches.find((o) => normalizePricingLabel(o.label) === 'standard');
    if (standard) {
      return standard.id;
    }
  }
  if (options.length === 1) {
    return options[0].id;
  }
  if (serviceRow && !isServicePriceTiersEnabled(serviceRow)) {
    return createFlowBasePricingId(sid);
  }
  if (centsMatches.length > 0) {
    return centsMatches[0].id;
  }

  return options[0]?.id ?? null;
}

/**
 * @param {object} args
 * @param {Record<string, unknown> | null | undefined} args.booking
 * @param {object} args.catalog services catalog hook result
 * @param {boolean} args.ownerHasPro
 * @param {Record<string, unknown>[]} args.priceOptionRows
 * @param {ReturnType<typeof addressFormFromBusinessShopLocation>} args.shopAddressForm
 * @param {string | null | undefined} args.businessServiceMode
 */
export function mapBookingToEditAppointmentForm({
  booking,
  catalog,
  ownerHasPro,
  priceOptionRows,
  shopAddressForm,
  businessServiceMode,
}) {
  if (!booking) {
    return null;
  }

  const enabledServices = (catalog?.services ?? []).filter((s) => s.isEnabled !== false);
  const { primary: serviceNamePrimary } = splitBookingServiceName(booking.service_name);

  const serviceIdFromRow =
    booking.service_id != null && String(booking.service_id).trim()
      ? String(booking.service_id).trim()
      : matchCatalogServiceIdByName(enabledServices, serviceNamePrimary);

  const selectedPricingId = serviceIdFromRow
    ? resolveEditAppointmentPricingId({
        booking,
        catalog,
        ownerHasPro,
        priceOptionRows,
        serviceId: serviceIdFromRow,
      })
    : null;

  const addonsForService = serviceIdFromRow
    ? catalogAddonsForService(serviceIdFromRow, catalog?.addons, catalog?.addonAssignments)
    : [];
  const selectedAddonIds = resolveEditAppointmentAddonIds({
    booking,
    catalogAddonsForService: addonsForService,
  });

  const appointmentLocationType = inferEditAppointmentLocationType(
    booking,
    shopAddressForm,
    businessServiceMode,
  );

  const bookingAddress = addressFormFromBooking(booking);
  const address =
    appointmentLocationType === CREATE_APPOINTMENT_LOCATION_SHOP
      ? { ...shopAddressForm }
      : bookingAddress.street || bookingAddress.city
        ? bookingAddress
        : createEmptyAddressForm();

  return {
    selectedServiceId: serviceIdFromRow,
    selectedPricingId,
    selectedAddonIds,
    selectedDateKey: calendarYyyyMmDdFromScheduledDate(booking.scheduled_date) || null,
    selectedTime: bookingStartTimeToScheduleLabel(booking.start_time),
    customer: {
      fullName: String(booking.customer_name ?? '').trim(),
      email: String(booking.customer_email ?? '').trim(),
      phone: bookingCustomerPhoneDigits(booking.customer_phone),
    },
    appointmentLocationType,
    address,
    vehicle: {
      year:
        booking.customer_vehicle_year != null && String(booking.customer_vehicle_year).trim()
          ? String(booking.customer_vehicle_year).trim()
          : '',
      make: String(booking.customer_vehicle_make ?? '').trim(),
      model: String(booking.customer_vehicle_model ?? '').trim(),
    },
    notes: String(booking.customer_notes ?? '').trim(),
  };
}

export function createEmptyEditAppointmentForm() {
  return {
    selectedServiceId: null,
    selectedPricingId: null,
    selectedAddonIds: [],
    selectedDateKey: null,
    selectedTime: null,
    customer: createEmptyCustomerForm(),
    appointmentLocationType: null,
    address: createEmptyAddressForm(),
    vehicle: createEmptyVehicleForm(),
    notes: '',
  };
}

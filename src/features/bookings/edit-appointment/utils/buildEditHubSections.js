import { formatScheduledDateUserFacing } from '../../../quotes/utils/formatScheduledDateDisplay';
import { CREATE_APPOINTMENT_STEP } from '../../create-appointment/constants';
import {
  CREATE_APPOINTMENT_LOCATION_MOBILE,
  CREATE_APPOINTMENT_LOCATION_SHOP,
} from '../../create-appointment/utils/createAppointmentServiceLocation';
import { formatAppointmentAddressSingleLine } from '../../create-appointment/utils/formatAppointmentAddress';

/**
 * @typedef {object} EditHubSection
 * @property {string} id
 * @property {string} title
 * @property {string} summary
 * @property {keyof typeof import('@expo/vector-icons').Ionicons.glyphMap} icon
 * @property {number} step
 * @property {number} [summaryMaxLines] lines before ellipsis in the hub row
 */

const HUB_SUMMARY_MAX_CHARS = 96;

/** Truncate long hub previews — RN ellipsis alone is not enough for very long single tokens. */
export function truncateHubSummary(value, max = HUB_SUMMARY_MAX_CHARS) {
  const text = String(value ?? '').trim();
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function vehicleSummary(vehicle, notes) {
  const parts = [
    String(vehicle?.year ?? '').trim(),
    String(vehicle?.make ?? '').trim(),
    String(vehicle?.model ?? '').trim(),
  ].filter(Boolean);
  const vehicleLine = parts.join(' ').trim();
  const notesTrim = String(notes ?? '').trim();
  if (vehicleLine && notesTrim) {
    return `${vehicleLine} · ${notesTrim}`;
  }
  return vehicleLine || notesTrim || 'Not set';
}

function addonsSummary(selectedAddonRows) {
  const rows = selectedAddonRows ?? [];
  if (!rows.length) {
    return 'None selected';
  }
  if (rows.length === 1) {
    return String(rows[0]?.name ?? 'Add-on').trim() || '1 add-on';
  }
  return `${rows.length} add-ons selected`;
}

/**
 * Cards for the edit hub — each opens one wizard step.
 *
 * @param {object} args
 * @param {boolean} args.pricingSkipped
 * @param {boolean} args.addonsSkipped
 * @param {boolean} args.locationSkipped
 * @param {boolean} args.addressSkipped
 * @param {unknown} args.selectedService
 * @param {unknown} args.selectedPricingOption
 * @param {unknown[]} args.selectedAddonRows
 * @param {string | null} args.selectedDateKey
 * @param {string | null} args.selectedTime
 * @param {{ fullName?: string; phone?: string }} args.customer
 * @param {'mobile' | 'shop' | null} args.appointmentLocationType
 * @param {object} args.address
 * @param {object} args.vehicle
 * @param {string} args.notes
 * @returns {EditHubSection[]}
 */
export function buildEditHubSections({
  pricingSkipped,
  addonsSkipped,
  locationSkipped,
  addressSkipped,
  selectedService,
  selectedPricingOption,
  selectedAddonRows,
  selectedDateKey,
  selectedTime,
  customer,
  appointmentLocationType,
  address,
  vehicle,
  notes,
}) {
  /** @type {EditHubSection[]} */
  const sections = [];

  const serviceName = String(selectedService?.name ?? '').trim() || 'Not selected';
  const tierLabel = String(selectedPricingOption?.label ?? '').trim();
  const serviceSummary = truncateHubSummary(
    pricingSkipped && tierLabel && tierLabel !== 'Standard'
      ? `${serviceName} · ${tierLabel}`
      : serviceName,
  );

  sections.push({
    id: 'service',
    title: pricingSkipped ? 'Service' : 'Service & pricing',
    summary: serviceSummary,
    icon: 'briefcase-outline',
    step: CREATE_APPOINTMENT_STEP.SERVICE,
    summaryMaxLines: 3,
  });

  if (!pricingSkipped) {
    sections.push({
      id: 'pricing',
      title: 'Pricing option',
      summary: truncateHubSummary(tierLabel || 'Not selected'),
      icon: 'pricetag-outline',
      step: CREATE_APPOINTMENT_STEP.PRICING,
      summaryMaxLines: 2,
    });
  }

  if (!addonsSkipped) {
    sections.push({
      id: 'addons',
      title: 'Add-ons',
      summary: addonsSummary(selectedAddonRows),
      icon: 'add-circle-outline',
      step: CREATE_APPOINTMENT_STEP.ADDONS,
    });
  }

  const dateLabel = formatScheduledDateUserFacing(selectedDateKey);
  const timeLabel = String(selectedTime ?? '').trim();
  const scheduleSummary =
    dateLabel && timeLabel
      ? `${dateLabel} · ${timeLabel}`
      : dateLabel || timeLabel || 'Not scheduled';

  sections.push({
    id: 'schedule',
    title: 'Date & time',
    summary: scheduleSummary,
    icon: 'calendar-outline',
    step: CREATE_APPOINTMENT_STEP.SCHEDULE,
  });

  const customerName = String(customer?.fullName ?? '').trim() || 'Not set';
  sections.push({
    id: 'customer',
    title: 'Customer',
    summary: truncateHubSummary(customerName),
    icon: 'person-outline',
    step: CREATE_APPOINTMENT_STEP.CUSTOMER,
  });

  if (!locationSkipped) {
    const locationSummary =
      appointmentLocationType === CREATE_APPOINTMENT_LOCATION_SHOP
        ? 'At your shop'
        : appointmentLocationType === CREATE_APPOINTMENT_LOCATION_MOBILE
          ? 'Mobile service'
          : 'Not selected';
    sections.push({
      id: 'location',
      title: 'Service location',
      summary: locationSummary,
      icon: 'navigate-outline',
      step: CREATE_APPOINTMENT_STEP.LOCATION,
    });
  }

  if (!addressSkipped) {
    const addressLine = formatAppointmentAddressSingleLine(address);
    sections.push({
      id: 'address',
      title: 'Service address',
      summary: truncateHubSummary(addressLine || 'Not set'),
      icon: 'location-outline',
      step: CREATE_APPOINTMENT_STEP.ADDRESS,
      summaryMaxLines: 3,
    });
  }

  sections.push({
    id: 'vehicle',
    title: 'Vehicle & notes',
    summary: truncateHubSummary(vehicleSummary(vehicle, notes)),
    icon: 'car-sport-outline',
    step: CREATE_APPOINTMENT_STEP.VEHICLE,
    summaryMaxLines: 3,
  });

  return sections;
}

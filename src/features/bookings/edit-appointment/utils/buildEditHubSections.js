import { formatScheduledDateUserFacing } from '../../../quotes/utils/formatScheduledDateDisplay';
import { CREATE_APPOINTMENT_STEP } from '../../create-appointment/constants';
import {
  CREATE_APPOINTMENT_LOCATION_MOBILE,
  CREATE_APPOINTMENT_LOCATION_SHOP,
} from '../../create-appointment/utils/createAppointmentServiceLocation';
import { formatAppointmentAddressSingleLine } from '../../create-appointment/utils/formatAppointmentAddress';
import { EDIT_APPOINTMENT_JOBS_LIST, EDIT_APPOINTMENT_NOTES } from '../constants';
import { formatEditJobsHubSummary } from './mapBookingJobsForEdit';

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
const HUB_ADDRESS_MAX_CHARS = 64;

/** Truncate long hub previews — RN ellipsis alone is not enough for very long single tokens. */
export function truncateHubSummary(value, max = HUB_SUMMARY_MAX_CHARS) {
  const text = String(value ?? '').trim();
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/**
 * Compact schedule preview for the edit hub.
 * Example: `Mon, Jul 27 · 9 AM` (minutes only when not :00).
 *
 * @param {string | null | undefined} selectedDateKey
 * @param {string | null | undefined} selectedTime
 * @returns {string}
 */
export function formatEditHubScheduleSummary(selectedDateKey, selectedTime) {
  const timeLabel = formatCompactClockLabel(selectedTime);
  const s = String(selectedDateKey ?? '').trim();
  let dateLabel = '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, mo, d] = s.split('-').map((x) => Number(x));
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) {
      dateLabel = dt.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  }
  if (!dateLabel) {
    dateLabel = formatScheduledDateUserFacing(selectedDateKey);
  }
  if (dateLabel && timeLabel) {
    return `${dateLabel} · ${timeLabel}`;
  }
  return dateLabel || timeLabel || 'Not scheduled';
}

/**
 * `9:00 AM` → `9 AM`; `9:30 AM` → `9:30 AM`.
 *
 * @param {string | null | undefined} timeLabel
 */
export function formatCompactClockLabel(timeLabel) {
  const raw = String(timeLabel ?? '').trim();
  if (!raw) return '';
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(raw);
  if (!m) return raw;
  const hour = String(Number(m[1]));
  const mins = m[2] ?? '00';
  const meridiem = m[3].toUpperCase();
  if (mins === '00') {
    return `${hour} ${meridiem}`;
  }
  return `${hour}:${mins} ${meridiem}`;
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
 * Single-job: Service / Pricing / Add-ons / Vehicle & notes (unchanged).
 * Multi-job: Jobs list + visit fields; vehicles live under each job; Notes are visit-level.
 *
 * @param {object} args
 * @param {boolean} [args.isMultiJob]
 * @param {import('./mapBookingJobsForEdit').EditJobSnapshot[]} [args.jobs]
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
  isMultiJob = false,
  jobs = [],
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

  if (isMultiJob) {
    sections.push({
      id: 'jobs',
      title: 'Jobs',
      summary: truncateHubSummary(formatEditJobsHubSummary(jobs)),
      icon: 'briefcase-outline',
      step: EDIT_APPOINTMENT_JOBS_LIST,
      summaryMaxLines: 2,
    });
  } else {
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
  }

  sections.push({
    id: 'schedule',
    title: 'Date & time',
    summary: formatEditHubScheduleSummary(selectedDateKey, selectedTime),
    icon: 'calendar-outline',
    step: CREATE_APPOINTMENT_STEP.SCHEDULE,
    summaryMaxLines: 2,
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
      summary: truncateHubSummary(addressLine || 'Not set', HUB_ADDRESS_MAX_CHARS),
      icon: 'location-outline',
      step: CREATE_APPOINTMENT_STEP.ADDRESS,
      summaryMaxLines: 2,
    });
  }

  if (isMultiJob) {
    const notesTrim = String(notes ?? '').trim();
    sections.push({
      id: 'notes',
      title: 'Notes',
      summary: truncateHubSummary(notesTrim || 'No notes'),
      icon: 'document-text-outline',
      step: EDIT_APPOINTMENT_NOTES,
      summaryMaxLines: 2,
    });
  } else {
    sections.push({
      id: 'vehicle',
      title: 'Vehicle & notes',
      summary: truncateHubSummary(vehicleSummary(vehicle, notes)),
      icon: 'car-sport-outline',
      step: CREATE_APPOINTMENT_STEP.VEHICLE,
      summaryMaxLines: 3,
    });
  }

  return sections;
}

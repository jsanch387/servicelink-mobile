import { formatScheduledDateUserFacing } from '../../../quotes/utils/formatScheduledDateDisplay';
import { CREATE_APPOINTMENT_STEP } from '../../create-appointment/constants';
import {
  CREATE_APPOINTMENT_LOCATION_MOBILE,
  CREATE_APPOINTMENT_LOCATION_SHOP,
} from '../../create-appointment/utils/createAppointmentServiceLocation';
import { formatAppointmentAddressSingleLine } from '../../create-appointment/utils/formatAppointmentAddress';
import {
  EDIT_APPOINTMENT_ADDONS_ENTRY,
  EDIT_APPOINTMENT_JOBS_LIST,
  EDIT_APPOINTMENT_NOTES,
} from '../constants';
import { formatEditJobsHubSummary } from './mapBookingJobsForEdit';
import { isEditJobCustom } from './editJobDraft';

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

/**
 * Visit-level add-ons summary across jobs (for the hub row).
 *
 * @param {import('./mapBookingJobsForEdit').EditJobSnapshot[] | null | undefined} jobs
 */
export function formatEditVisitAddonsHubSummary(jobs) {
  const list = Array.isArray(jobs) ? jobs : [];
  let count = 0;
  let firstName = '';
  for (const job of list) {
    if (isEditJobCustom(job)) continue;
    const rows = Array.isArray(job?.selectedAddonRows) ? job.selectedAddonRows : [];
    for (const row of rows) {
      count += 1;
      if (!firstName) {
        firstName = String(row?.name ?? '').trim();
      }
    }
  }
  if (count === 0) return 'None selected';
  if (count === 1) return firstName || '1 add-on';
  return `${count} add-ons selected`;
}

/**
 * Cards for the edit visit hub — Jobs, Add-ons, visit fields, Notes.
 * Per-job Service & pricing / Vehicle live under Jobs → job hub.
 *
 * @param {object} args
 * @param {import('./mapBookingJobsForEdit').EditJobSnapshot[]} [args.jobs]
 * @param {boolean} [args.showAddonsSection]
 * @param {boolean} args.locationSkipped
 * @param {boolean} args.addressSkipped
 * @param {string | null} args.selectedDateKey
 * @param {string | null} args.selectedTime
 * @param {{ fullName?: string; phone?: string }} args.customer
 * @param {'mobile' | 'shop' | null} args.appointmentLocationType
 * @param {object} args.address
 * @param {string} args.notes
 * @returns {EditHubSection[]}
 */
export function buildEditHubSections({
  jobs = [],
  showAddonsSection = true,
  locationSkipped,
  addressSkipped,
  selectedDateKey,
  selectedTime,
  customer,
  appointmentLocationType,
  address,
  notes,
}) {
  /** @type {EditHubSection[]} */
  const sections = [];

  sections.push({
    id: 'jobs',
    title: 'Jobs',
    summary: truncateHubSummary(formatEditJobsHubSummary(jobs)),
    icon: 'briefcase-outline',
    step: EDIT_APPOINTMENT_JOBS_LIST,
    summaryMaxLines: 2,
  });

  if (showAddonsSection) {
    sections.push({
      id: 'addons',
      title: 'Add-ons',
      summary: truncateHubSummary(formatEditVisitAddonsHubSummary(jobs)),
      icon: 'add-circle-outline',
      step: EDIT_APPOINTMENT_ADDONS_ENTRY,
      summaryMaxLines: 2,
    });
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

  const notesTrim = String(notes ?? '').trim();
  sections.push({
    id: 'notes',
    title: 'Notes',
    summary: truncateHubSummary(notesTrim || 'No notes'),
    icon: 'document-text-outline',
    step: EDIT_APPOINTMENT_NOTES,
    summaryMaxLines: 2,
  });

  return sections;
}

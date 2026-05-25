import { normalizeCalendarYyyyMmDd } from '../../customers/maintenance-invite/utils/formatPreferredDateDisplay';
import {
  formatMaintenanceAnchorTime12h,
  maintenanceAnchorDateIsPlaceholder,
} from './formatMaintenanceDisplay';
import { maintenanceEnrollmentIsPending } from './maintenanceEnrollmentUtils';

const DEFAULT_SUGGESTED_TIME_12H = '10:00 AM';

/**
 * @param {string | null | undefined} anchorTime
 * @returns {boolean}
 */
function hasValidOwnerAnchorTime(anchorTime) {
  const raw = String(anchorTime ?? '').trim();
  if (!raw || raw.startsWith('00:00')) {
    return false;
  }
  return Boolean(formatMaintenanceAnchorTime12h(anchorTime));
}

/**
 * Pending enrollments created without an owner-suggested visit sometimes still get
 * `anchor_date` / `anchor_time` stamped at insert (same calendar day as `created_at`, 10:00).
 *
 * @param {string} anchorDateYyyyMmDd
 * @param {string | null | undefined} anchorTime
 * @param {string} createdAtIso
 * @returns {boolean}
 */
function isLikelyAutoAnchorAtCreate(anchorDateYyyyMmDd, anchorTime, createdAtIso) {
  const createdDay = normalizeCalendarYyyyMmDd(createdAtIso);
  if (!createdDay || anchorDateYyyyMmDd !== createdDay) {
    return false;
  }
  const time12 = formatMaintenanceAnchorTime12h(anchorTime);
  return !time12 || time12 === DEFAULT_SUGGESTED_TIME_12H;
}

/**
 * @param {import('../../customers/api/fetchCustomersApi').CustomerMaintenanceEnrollmentSummary | null | undefined} enrollment
 * @returns {boolean}
 */
export function maintenanceEnrollmentHasOwnerSuggestedSchedule(enrollment) {
  const anchorDate = enrollment?.anchorDate;
  const normalizedDate = normalizeCalendarYyyyMmDd(anchorDate);
  if (!normalizedDate || maintenanceAnchorDateIsPlaceholder(anchorDate)) {
    return false;
  }
  if (!hasValidOwnerAnchorTime(enrollment?.anchorTime)) {
    return false;
  }
  if (
    maintenanceEnrollmentIsPending(enrollment) &&
    enrollment?.createdAt &&
    isLikelyAutoAnchorAtCreate(normalizedDate, enrollment.anchorTime, enrollment.createdAt)
  ) {
    return false;
  }
  return true;
}

/**
 * @param {import('../../customers/api/fetchCustomersApi').CustomerMaintenanceEnrollmentSummary | null | undefined} enrollment
 * @returns {boolean}
 */
export function maintenanceEnrollmentShowsCustomerChoosesSchedule(enrollment) {
  if (!maintenanceEnrollmentIsPending(enrollment)) {
    return false;
  }
  return !maintenanceEnrollmentHasOwnerSuggestedSchedule(enrollment);
}

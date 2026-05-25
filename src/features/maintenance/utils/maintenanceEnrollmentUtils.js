/** @typedef {import('../../customers/api/fetchCustomersApi').CustomerMaintenanceEnrollmentSummary} CustomerMaintenanceEnrollmentSummary */

/** Status for enrollments awaiting customer pay + confirm from their link. */
export const MAINTENANCE_ENROLLMENT_PENDING_STATUS = 'enrolled_pending_customer';

const PENDING_STATUS = MAINTENANCE_ENROLLMENT_PENDING_STATUS;

/**
 * Visit done when the linked booking (`initial_booking_id`) is `completed`, or enrollment
 * status is legacy `visit_completed` if the DB constraint is extended later.
 *
 * @param {CustomerMaintenanceEnrollmentSummary | null | undefined} enrollment
 * @returns {boolean}
 */
export function maintenanceEnrollmentHasCompletedVisit(enrollment) {
  if (!enrollment) {
    return false;
  }
  if (String(enrollment.status ?? '').trim() === 'visit_completed') {
    return true;
  }
  return String(enrollment.linkedBookingStatus ?? '').trim() === 'completed';
}

/**
 * @param {CustomerMaintenanceEnrollmentSummary | null | undefined} enrollment
 * @returns {string}
 */
export function maintenanceEnrollmentStatusLabel(enrollment) {
  if (!enrollment) {
    return '';
  }
  const status = String(enrollment.status ?? '').trim();

  if (status === PENDING_STATUS) {
    return 'Pending';
  }
  if (maintenanceEnrollmentHasCompletedVisit(enrollment)) {
    return 'Completed';
  }
  if (status === 'accepted') {
    return 'Confirmed';
  }
  if (status === 'cancelled') {
    return 'Cancelled';
  }
  return status.replaceAll('_', ' ');
}

/**
 * @param {CustomerMaintenanceEnrollmentSummary | null | undefined} enrollment
 * @returns {boolean}
 */
export function maintenanceEnrollmentIsPending(enrollment) {
  return String(enrollment?.status ?? '').trim() === PENDING_STATUS;
}

/**
 * @param {CustomerMaintenanceEnrollmentSummary | null | undefined} enrollment
 * @returns {boolean}
 */
export function maintenanceEnrollmentIsCompleted(enrollment) {
  return maintenanceEnrollmentHasCompletedVisit(enrollment);
}

/**
 * @param {CustomerMaintenanceEnrollmentSummary | null | undefined} enrollment
 * @returns {boolean}
 */
export function maintenanceEnrollmentIsConfirmed(enrollment) {
  const status = String(enrollment?.status ?? '').trim();
  if (maintenanceEnrollmentHasCompletedVisit(enrollment)) {
    return false;
  }
  return status === 'accepted';
}

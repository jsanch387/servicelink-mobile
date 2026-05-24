/** @typedef {import('../../customers/api/fetchCustomersApi').CustomerMaintenanceEnrollmentSummary} CustomerMaintenanceEnrollmentSummary */

const PENDING_STATUS = 'enrolled_pending_customer';

/**
 * @param {CustomerMaintenanceEnrollmentSummary | null | undefined} enrollment
 * @returns {boolean}
 */
export function maintenanceEnrollmentBlocksNewOwnerInvite(enrollment) {
  if (!enrollment) {
    return false;
  }
  const status = String(enrollment.status ?? '').trim();
  const inviteToken = String(enrollment.inviteToken ?? '').trim();
  return status === PENDING_STATUS && Boolean(inviteToken);
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
  const paymentStatus = String(enrollment.paymentStatus ?? '').trim();

  if (status === PENDING_STATUS) {
    return 'Pending';
  }
  if (status === 'accepted' && paymentStatus === 'paid') {
    return 'Confirmed';
  }
  if (status === 'accepted' && paymentStatus === 'pay_in_person') {
    return 'Pay in person';
  }
  if (status === 'accepted') {
    return 'Confirmed';
  }
  if (status === 'visit_completed') {
    return 'Completed';
  }
  if (status === 'cancelled') {
    return 'Cancelled';
  }
  return status.replaceAll('_', ' ');
}

/**
 * @param {CustomerMaintenanceEnrollmentSummary | null | undefined} enrollment
 * @returns {string}
 */
export function customerDetailMaintenanceActionLabel(enrollment) {
  if (!enrollment?.enrollmentId) {
    return 'Offer maintenance service';
  }
  const statusLabel = maintenanceEnrollmentStatusLabel(enrollment);
  return statusLabel ? `Maintenance · ${statusLabel}` : 'Maintenance';
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
export function maintenanceEnrollmentIsConfirmed(enrollment) {
  const status = String(enrollment?.status ?? '').trim();
  return status === 'accepted' || status === 'visit_completed';
}

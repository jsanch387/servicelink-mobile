import {
  formatMaintenanceAnchorDate,
  formatMaintenanceAnchorTime,
  formatMaintenanceDuration,
  formatMaintenancePrice,
} from './formatMaintenanceDisplay';
import { MAINTENANCE_DETAIL_CUSTOMER_CHOOSES_SCHEDULE_COPY } from '../constants';
import { buildMaintenancePaymentSection } from './buildMaintenancePaymentSection';
import {
  maintenanceEnrollmentHasCompletedVisit,
  maintenanceEnrollmentIsCompleted,
  maintenanceEnrollmentIsConfirmed,
  maintenanceEnrollmentIsPending,
  maintenanceEnrollmentStatusLabel,
} from './maintenanceEnrollmentUtils';
import {
  maintenanceEnrollmentHasOwnerSuggestedSchedule,
  maintenanceEnrollmentShowsCustomerChoosesSchedule,
} from './maintenanceScheduleUtils';

/**
 * @typedef {import('../../customers/api/fetchCustomersApi').CustomersApiCustomer} CustomersApiCustomer
 */

/**
 * @param {CustomersApiCustomer[]} customers
 */
export function partitionMaintenanceInbox(customers) {
  const rows = customers.filter((row) => row.maintenanceEnrollment);
  return {
    pending: rows.filter((row) => maintenanceEnrollmentIsPending(row.maintenanceEnrollment)),
    confirmed: rows.filter((row) => maintenanceEnrollmentIsConfirmed(row.maintenanceEnrollment)),
    completed: rows.filter((row) => maintenanceEnrollmentIsCompleted(row.maintenanceEnrollment)),
  };
}

/**
 * @param {CustomersApiCustomer} customer
 */
export function mapMaintenanceEnrollmentCard(customer) {
  const enrollment = customer.maintenanceEnrollment;
  const price = formatMaintenancePrice(enrollment?.priceCents);
  const duration = formatMaintenanceDuration(enrollment?.durationMinutes);
  const visitCompleted = maintenanceEnrollmentHasCompletedVisit(enrollment);
  return {
    customerId: customer.id,
    customerName: customer.fullName,
    enrollmentId: enrollment?.enrollmentId ?? '',
    statusLabel: maintenanceEnrollmentStatusLabel(enrollment),
    statusRaw: visitCompleted ? 'visit_completed' : String(enrollment?.status ?? ''),
    line: `${price} · ${duration}`,
  };
}

/**
 * @param {CustomersApiCustomer} customer
 * @param {string} siteOrigin
 */
export function mapMaintenanceDetailModel(customer, siteOrigin = '') {
  const enrollment = customer.maintenanceEnrollment;
  const scheduleChosenByOwner = maintenanceEnrollmentHasOwnerSuggestedSchedule(enrollment);
  const showCustomerChoosesSchedule = maintenanceEnrollmentShowsCustomerChoosesSchedule(enrollment);
  const inviteToken = String(enrollment?.inviteToken ?? '').trim();
  const origin = String(siteOrigin ?? '')
    .trim()
    .replace(/\/$/, '');
  const inviteLink = inviteToken && origin ? `${origin}/maintenance/e/${inviteToken}` : '';

  return {
    customerId: customer.id,
    customerName: customer.fullName,
    customerEmail: customer.email,
    enrollmentId: enrollment?.enrollmentId ?? '',
    serviceTitle: enrollment?.serviceNameSnapshot || 'Maintenance detail',
    priceFormatted: formatMaintenancePrice(enrollment?.priceCents),
    durationLabel: formatMaintenanceDuration(enrollment?.durationMinutes),
    scheduleChosenByOwner,
    showCustomerChoosesSchedule,
    customerChoosesScheduleCopy: MAINTENANCE_DETAIL_CUSTOMER_CHOOSES_SCHEDULE_COPY,
    anchorDateDisplay: scheduleChosenByOwner
      ? formatMaintenanceAnchorDate(enrollment?.anchorDate)
      : '',
    anchorTimeDisplay: scheduleChosenByOwner
      ? formatMaintenanceAnchorTime(enrollment?.anchorDate, enrollment?.anchorTime)
      : '',
    statusLabel: maintenanceEnrollmentStatusLabel(enrollment),
    statusRaw: maintenanceEnrollmentHasCompletedVisit(enrollment)
      ? 'visit_completed'
      : String(enrollment?.status ?? ''),
    paymentStatus: String(enrollment?.paymentStatus ?? ''),
    initialBookingId: String(enrollment?.initialBookingId ?? '').trim() || null,
    payment: buildMaintenancePaymentSection({
      status: enrollment?.status,
      paymentStatus: enrollment?.paymentStatus,
      linkedBookingStatus: enrollment?.linkedBookingStatus,
      priceCents: enrollment?.priceCents,
    }),
    inviteLink,
    canCopyLink: Boolean(inviteLink),
    canDelete: maintenanceEnrollmentIsPending(enrollment),
  };
}

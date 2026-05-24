import {
  formatMaintenanceAnchor,
  formatMaintenanceDuration,
  formatMaintenancePrice,
} from './formatMaintenanceDisplay';
import {
  maintenanceEnrollmentIsConfirmed,
  maintenanceEnrollmentIsPending,
  maintenanceEnrollmentStatusLabel,
} from './maintenanceEnrollmentUtils';

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
  };
}

/**
 * @param {CustomersApiCustomer} customer
 */
export function mapMaintenanceEnrollmentCard(customer) {
  const enrollment = customer.maintenanceEnrollment;
  const price = formatMaintenancePrice(enrollment?.priceCents);
  const duration = formatMaintenanceDuration(enrollment?.durationMinutes);
  return {
    customerId: customer.id,
    customerName: customer.fullName,
    enrollmentId: enrollment?.enrollmentId ?? '',
    statusLabel: maintenanceEnrollmentStatusLabel(enrollment),
    statusRaw: String(enrollment?.status ?? ''),
    line: `${price} · ${duration}`,
  };
}

/**
 * @param {CustomersApiCustomer} customer
 * @param {string} siteOrigin
 */
export function mapMaintenanceDetailModel(customer, siteOrigin = '') {
  const enrollment = customer.maintenanceEnrollment;
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
    anchorLabel: formatMaintenanceAnchor(enrollment?.anchorDate, enrollment?.anchorTime),
    statusLabel: maintenanceEnrollmentStatusLabel(enrollment),
    statusRaw: String(enrollment?.status ?? ''),
    paymentStatus: String(enrollment?.paymentStatus ?? ''),
    inviteLink,
    canCopyLink: Boolean(inviteLink),
  };
}

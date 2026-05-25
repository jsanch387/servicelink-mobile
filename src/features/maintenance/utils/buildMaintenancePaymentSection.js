import { formatMaintenancePrice } from './formatMaintenanceDisplay';
import {
  MAINTENANCE_ENROLLMENT_PENDING_STATUS,
  maintenanceEnrollmentHasCompletedVisit,
} from './maintenanceEnrollmentUtils';

/**
 * @typedef {object} MaintenancePaymentModel
 * @property {boolean} visible
 * @property {string} status
 * @property {string | null} detail
 * @property {string} accessibilityLabel
 */

/**
 * @returns {MaintenancePaymentModel}
 */
function emptyPaymentModel() {
  return {
    visible: false,
    status: '',
    detail: null,
    accessibilityLabel: '',
  };
}

/**
 * Payment block for maintenance detail — shown after customer confirms, not on list cards.
 *
 * @param {object} input
 * @param {string | null | undefined} input.status
 * @param {string | null | undefined} input.paymentStatus
 * @param {string | null | undefined} [input.linkedBookingStatus]
 * @param {number | null | undefined} input.priceCents
 * @returns {MaintenancePaymentModel}
 */
export function buildMaintenancePaymentSection({
  status,
  paymentStatus,
  linkedBookingStatus,
  priceCents,
}) {
  const enrollmentStatus = String(status ?? '').trim();
  const pay = String(paymentStatus ?? '')
    .trim()
    .toLowerCase();

  if (
    enrollmentStatus === MAINTENANCE_ENROLLMENT_PENDING_STATUS ||
    enrollmentStatus === 'cancelled' ||
    enrollmentStatus === 'declined'
  ) {
    return emptyPaymentModel();
  }

  const visitCompleted =
    enrollmentStatus === 'visit_completed' ||
    maintenanceEnrollmentHasCompletedVisit({
      status: enrollmentStatus,
      linkedBookingStatus,
    });

  if (enrollmentStatus !== 'accepted' && !visitCompleted) {
    return emptyPaymentModel();
  }

  const priceFormatted = formatMaintenancePrice(priceCents);

  if (pay === 'paid') {
    const detail = priceFormatted !== '—' ? priceFormatted : null;
    const accessibilityLabel = detail ? `Paid online. ${detail}.` : 'Paid online.';
    return {
      visible: true,
      status: 'Paid online',
      detail,
      accessibilityLabel,
    };
  }

  if (pay === 'pay_in_person') {
    const detail = priceFormatted !== '—' ? `${priceFormatted} due` : 'Amount due at visit';
    const accessibilityLabel =
      priceFormatted !== '—'
        ? `Pay in person. ${priceFormatted} due.`
        : 'Pay in person. Amount due at visit.';
    return {
      visible: true,
      status: 'Pay in person',
      detail,
      accessibilityLabel,
    };
  }

  return emptyPaymentModel();
}

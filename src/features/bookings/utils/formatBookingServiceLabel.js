import { splitBookingServiceName } from '../../../utils/splitBookingServiceName';
import { parseJobDetailsFromBooking } from '../booking-details/utils/parseJobDetailsFromBooking';

/**
 * @param {object | null | undefined} booking
 * @returns {{ primary: string; extraCount: number; label: string }}
 */
export function getBookingServiceLabelParts(booking) {
  const jobDetails = booking?.job_details ?? booking?.jobDetails ?? null;
  const jobs = parseJobDetailsFromBooking(jobDetails);
  const visitCount = Math.max(
    0,
    Math.round(Number(booking?.visit_job_count ?? booking?.visitJobCount) || 0),
  );
  const jobCount = jobs.length > 0 ? jobs.length : visitCount > 0 ? visitCount : 1;

  const primary =
    jobs.length > 0
      ? splitBookingServiceName(jobs[0].serviceName).primary
      : splitBookingServiceName(booking?.service_name ?? booking?.serviceName).primary;

  const labelPrimary = primary || 'Service';
  const extraCount = jobCount > 1 ? jobCount - 1 : 0;
  const label = extraCount > 0 ? `${labelPrimary} +${extraCount} more` : labelPrimary;

  return { primary: labelPrimary, extraCount, label };
}

/**
 * Calendar / list service line: base service name only (no pricing tier),
 * plus `+N more` when the appointment has multiple jobs.
 *
 * @param {object | null | undefined} booking
 * @returns {string}
 */
export function formatBookingServiceLabel(booking) {
  return getBookingServiceLabelParts(booking).label;
}

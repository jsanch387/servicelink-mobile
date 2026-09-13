import { CREATE_APPOINTMENT_MAX_JOBS } from '../../create-appointment/constants';
import { parsePriceLabelToUsd } from '../../create-appointment/utils/priceLabelMath';

/**
 * Append a finished add-job snapshot. No-ops at the visit cap.
 *
 * @param {import('./mapBookingJobsForEdit').EditJobSnapshot[] | null | undefined} jobs
 * @param {import('./mapBookingJobsForEdit').EditJobSnapshot | null | undefined} snapshot
 * @param {number} [maxJobs]
 * @returns {import('./mapBookingJobsForEdit').EditJobSnapshot[]}
 */
export function appendAddedEditJob(jobs, snapshot, maxJobs = CREATE_APPOINTMENT_MAX_JOBS) {
  const list = Array.isArray(jobs) ? [...jobs] : [];
  if (!snapshot) return list;
  if (list.length >= maxJobs) return list;
  return [...list, snapshot];
}

/**
 * Drop one job. No-ops if the index is invalid or it would leave zero jobs.
 *
 * @param {import('./mapBookingJobsForEdit').EditJobSnapshot[] | null | undefined} jobs
 * @param {number} index
 * @returns {import('./mapBookingJobsForEdit').EditJobSnapshot[]}
 */
export function removeEditJobAtIndex(jobs, index) {
  const list = Array.isArray(jobs) ? [...jobs] : [];
  if (list.length <= 1) return list;
  const at = Math.round(Number(index));
  if (!Number.isFinite(at) || at < 0 || at >= list.length) return list;
  list.splice(at, 1);
  return list;
}

/**
 * Visit gross (services + add-ons) for payment sync after edit.
 *
 * @param {import('./mapBookingJobsForEdit').EditJobSnapshot[] | null | undefined} jobs
 * @returns {number}
 */
export function visitGrossCentsFromEditJobs(jobs) {
  return (jobs ?? []).reduce((sum, job) => {
    const serviceCents = Math.max(
      0,
      Math.round(Number(job?.selectedPricingOption?.priceCents) || 0),
    );
    const addonCents = (job?.selectedAddonRows ?? []).reduce((addonSum, addon) => {
      if (addon?.priceCents != null && Number.isFinite(Number(addon.priceCents))) {
        return addonSum + Math.max(0, Math.round(Number(addon.priceCents)));
      }
      return addonSum + Math.round(parsePriceLabelToUsd(addon?.priceLabel) * 100);
    }, 0);
    return sum + serviceCents + addonCents;
  }, 0);
}

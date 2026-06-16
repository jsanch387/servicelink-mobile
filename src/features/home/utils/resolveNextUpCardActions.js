import { JOB_STATUS, normalizeJobStatus } from '../../bookings/constants/jobStatus';

/** @typedef {'upcoming' | 'en_route' | 'working' | 'complete'} NextUpCardActionMode */

/**
 * Drives Next Up card CTAs from `bookings.job_status` (owner action flow).
 *
 * @param {string | null | undefined} jobStatus
 * @returns {NextUpCardActionMode}
 */
export function resolveNextUpCardActionMode(jobStatus) {
  const status = normalizeJobStatus(jobStatus);
  switch (status) {
    case JOB_STATUS.COMPLETED:
      return 'complete';
    case JOB_STATUS.IN_PROGRESS:
      return 'working';
    case JOB_STATUS.ON_THE_WAY:
      return 'en_route';
    default:
      return 'upcoming';
  }
}

/**
 * Home section label above the spotlight card.
 *
 * @param {NextUpCardActionMode} actionMode
 * @returns {'Next Up' | 'In progress'}
 */
export function resolveNextUpSectionTitle(actionMode) {
  if (actionMode === 'working') {
    return 'In progress';
  }
  return 'Next Up';
}

/**
 * @param {NextUpCardActionMode} actionMode
 * @returns {boolean}
 */
export function shouldShowNextUpLivePulse(actionMode) {
  return actionMode === 'working';
}

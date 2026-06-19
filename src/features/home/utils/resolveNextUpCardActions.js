import {
  isWorkHandoffDone,
  JOB_STATUS,
  normalizeJobStatus,
} from '../../bookings/constants/jobStatus';

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
 * @typedef {'handoff' | 'ready'} NextUpWorkingPhase
 */

/**
 * In-progress sub-phase before mark complete (work finished handoff).
 *
 * @param {string | null | undefined} jobStatus
 * @param {string | null | undefined} workHandoffStatus
 * @returns {NextUpWorkingPhase | null}
 */
export function resolveNextUpWorkingPhase(jobStatus, workHandoffStatus) {
  const status = normalizeJobStatus(jobStatus);
  if (status !== JOB_STATUS.IN_PROGRESS) {
    return null;
  }
  return isWorkHandoffDone(workHandoffStatus) ? 'ready' : 'handoff';
}

/**
 * @param {NextUpCardActionMode} actionMode
 * @returns {boolean}
 */
export function shouldShowNextUpLivePulse(actionMode) {
  return actionMode === 'working';
}

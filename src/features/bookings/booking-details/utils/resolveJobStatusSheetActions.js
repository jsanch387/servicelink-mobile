import { JOB_STATUS, isWorkHandoffDone, normalizeJobStatus } from '../../constants/jobStatus';

/** @typedef {'on_the_way' | 'start_job' | 'work_finished'} JobStatusSheetActionId */
/** @typedef {'active' | 'done' | 'upcoming'} JobStatusSheetRowState */

/**
 * Maps booking lifecycle to Job Status sheet row states.
 *
 * @param {string | null | undefined} jobStatus
 * @param {string | null | undefined} workHandoffStatus
 * @returns {{
 *   on_the_way: JobStatusSheetRowState;
 *   start_job: JobStatusSheetRowState;
 *   work_finished: JobStatusSheetRowState;
 *   allDone: boolean;
 * }}
 */
export function resolveJobStatusSheetActions(jobStatus, workHandoffStatus) {
  const status = normalizeJobStatus(jobStatus);
  const handoffDone = status === JOB_STATUS.COMPLETED || isWorkHandoffDone(workHandoffStatus);

  if (status === JOB_STATUS.COMPLETED || handoffDone) {
    return {
      on_the_way: 'done',
      start_job: 'done',
      work_finished: 'done',
      allDone: true,
    };
  }

  if (status === JOB_STATUS.IN_PROGRESS) {
    return {
      on_the_way: 'done',
      start_job: 'done',
      work_finished: 'active',
      allDone: false,
    };
  }

  if (status === JOB_STATUS.ON_THE_WAY) {
    return {
      on_the_way: 'done',
      start_job: 'active',
      work_finished: 'upcoming',
      allDone: false,
    };
  }

  return {
    on_the_way: 'active',
    start_job: 'upcoming',
    work_finished: 'upcoming',
    allDone: false,
  };
}

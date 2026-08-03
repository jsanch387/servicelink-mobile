import { JOB_STATUS } from '../../constants/jobStatus';
import { resolveJobStatusSheetActions } from '../utils/resolveJobStatusSheetActions';

describe('resolveJobStatusSheetActions', () => {
  it('makes On my way active when the job has not started', () => {
    expect(resolveJobStatusSheetActions(JOB_STATUS.NOT_STARTED, null)).toEqual({
      on_the_way: 'active',
      start_job: 'upcoming',
      work_finished: 'upcoming',
      allDone: false,
    });
  });

  it('locks On my way and activates Start job when en route', () => {
    expect(resolveJobStatusSheetActions(JOB_STATUS.ON_THE_WAY, null)).toEqual({
      on_the_way: 'done',
      start_job: 'active',
      work_finished: 'upcoming',
      allDone: false,
    });
  });

  it('only allows Work finished while in progress before handoff', () => {
    expect(resolveJobStatusSheetActions(JOB_STATUS.IN_PROGRESS, null)).toEqual({
      on_the_way: 'done',
      start_job: 'done',
      work_finished: 'active',
      allDone: false,
    });
  });

  it('marks every step done after handoff or completion', () => {
    expect(resolveJobStatusSheetActions(JOB_STATUS.IN_PROGRESS, 'notified')).toEqual({
      on_the_way: 'done',
      start_job: 'done',
      work_finished: 'done',
      allDone: true,
    });
    expect(resolveJobStatusSheetActions(JOB_STATUS.COMPLETED, null)).toEqual({
      on_the_way: 'done',
      start_job: 'done',
      work_finished: 'done',
      allDone: true,
    });
  });
});

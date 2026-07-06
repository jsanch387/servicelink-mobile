import {
  BOOKING_ACTION,
  WORK_HANDOFF_STATUS,
  getNextBookingAction,
  isOnTheWayActionAvailable,
  isOnTheWayActionDone,
  isWorkHandoffDone,
  normalizeWorkHandoffStatus,
} from '../constants/jobStatus';

describe('jobStatus', () => {
  it('maps job_status to the next booking action', () => {
    expect(getNextBookingAction('not_started')).toBe(BOOKING_ACTION.ON_THE_WAY);
    expect(getNextBookingAction('on_the_way')).toBe(BOOKING_ACTION.JOB_STARTED);
    expect(getNextBookingAction('in_progress')).toBe(BOOKING_ACTION.JOB_COMPLETED);
    expect(getNextBookingAction('completed')).toBeNull();
  });

  it('detects on-the-way availability from job_status', () => {
    expect(isOnTheWayActionAvailable({ job_status: 'not_started' })).toBe(true);
    expect(isOnTheWayActionAvailable({ job_status: 'on_the_way' })).toBe(false);
    expect(isOnTheWayActionDone({ job_status: 'on_the_way' })).toBe(true);
  });

  it('normalizes work handoff status', () => {
    expect(normalizeWorkHandoffStatus('notified')).toBe(WORK_HANDOFF_STATUS.NOTIFIED);
    expect(normalizeWorkHandoffStatus('skipped')).toBe(WORK_HANDOFF_STATUS.SKIPPED);
    expect(normalizeWorkHandoffStatus(null)).toBeNull();
    expect(normalizeWorkHandoffStatus('pending')).toBeNull();
  });

  it('detects when Done/Skip handoff is complete', () => {
    expect(isWorkHandoffDone(null)).toBe(false);
    expect(isWorkHandoffDone('notified')).toBe(true);
    expect(isWorkHandoffDone('skipped')).toBe(true);
  });
});

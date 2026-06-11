import {
  BOOKING_ACTION,
  getNextBookingAction,
  isOnTheWayActionAvailable,
  isOnTheWayActionDone,
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
});

jest.mock('../jobLiveActivity', () => ({
  startJobLiveActivity: jest.fn(() => Promise.resolve()),
  endJobLiveActivity: jest.fn(() => Promise.resolve()),
}));

import { renderHook } from '@testing-library/react-native';
import { endJobLiveActivity, startJobLiveActivity } from '../jobLiveActivity';
import { useSyncInProgressJobLiveActivity } from '../useSyncInProgressJobLiveActivity';

describe('useSyncInProgressJobLiveActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts the timer when Home spotlight is in progress', () => {
    renderHook(() =>
      useSyncInProgressJobLiveActivity({
        id: 'book-1',
        job_status: 'in_progress',
        customer_name: 'Ana',
        service_name: 'Interior',
      }),
    );

    expect(startJobLiveActivity).toHaveBeenCalledWith({
      id: 'book-1',
      customer_name: 'Ana',
      service_name: 'Interior',
    });
    expect(endJobLiveActivity).not.toHaveBeenCalled();
  });

  it('ends the timer when the spotlight job is completed', () => {
    renderHook(() =>
      useSyncInProgressJobLiveActivity({
        id: 'book-1',
        job_status: 'completed',
        customer_name: 'Ana',
        service_name: 'Interior',
      }),
    );

    expect(endJobLiveActivity).toHaveBeenCalledWith('book-1');
    expect(startJobLiveActivity).not.toHaveBeenCalled();
  });

  it('does nothing without a booking id', () => {
    renderHook(() => useSyncInProgressJobLiveActivity(null));

    expect(startJobLiveActivity).not.toHaveBeenCalled();
    expect(endJobLiveActivity).not.toHaveBeenCalled();
  });
});

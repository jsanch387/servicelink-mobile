import { QueryClient } from '@tanstack/react-query';
import { homeBookingsUpcomingQueryKey } from '../../home/queryKeys';
import { patchBookingJobStatusInHomeCache } from '../utils/patchBookingJobStatusInHomeCache';

describe('patchBookingJobStatusInHomeCache', () => {
  it('updates spotlight booking job_status and work_handoff_status', () => {
    const queryClient = new QueryClient();
    const businessId = 'biz-1';
    const bookingId = 'book-1';
    queryClient.setQueryData(homeBookingsUpcomingQueryKey(businessId), {
      next: {
        id: bookingId,
        status: 'confirmed',
        job_status: 'in_progress',
        work_handoff_status: null,
      },
      upcomingCount: 1,
      nextSubtitle: '',
      spotlightMode: 'in_progress',
    });

    patchBookingJobStatusInHomeCache(
      queryClient,
      businessId,
      bookingId,
      'in_progress',
      null,
      'skipped',
    );

    expect(queryClient.getQueryData(homeBookingsUpcomingQueryKey(businessId))).toEqual({
      next: {
        id: bookingId,
        status: 'confirmed',
        job_status: 'in_progress',
        work_handoff_status: 'skipped',
      },
      upcomingCount: 1,
      nextSubtitle: '',
      spotlightMode: 'in_progress',
    });
  });

  it('no-ops when spotlight id does not match', () => {
    const queryClient = new QueryClient();
    const businessId = 'biz-1';
    const before = {
      next: { id: 'other', job_status: 'in_progress' },
      upcomingCount: 1,
    };
    queryClient.setQueryData(homeBookingsUpcomingQueryKey(businessId), before);

    patchBookingJobStatusInHomeCache(
      queryClient,
      businessId,
      'book-1',
      'in_progress',
      null,
      'notified',
    );

    expect(queryClient.getQueryData(homeBookingsUpcomingQueryKey(businessId))).toBe(before);
  });
});

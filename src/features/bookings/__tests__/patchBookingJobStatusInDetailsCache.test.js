import { QueryClient } from '@tanstack/react-query';
import { bookingsDetailsQueryKey } from '../queryKeys';
import { patchBookingJobStatusInDetailsCache } from '../utils/patchBookingJobStatusInDetailsCache';

describe('patchBookingJobStatusInDetailsCache', () => {
  it('sets job_status on the cached details booking', () => {
    const queryClient = new QueryClient();
    const bookingId = 'book-1';
    queryClient.setQueryData(bookingsDetailsQueryKey(bookingId), {
      id: bookingId,
      status: 'confirmed',
      job_status: 'not_started',
    });

    patchBookingJobStatusInDetailsCache(queryClient, bookingId, 'on_the_way');

    expect(queryClient.getQueryData(bookingsDetailsQueryKey(bookingId))).toEqual({
      id: bookingId,
      status: 'confirmed',
      job_status: 'on_the_way',
    });
  });
});

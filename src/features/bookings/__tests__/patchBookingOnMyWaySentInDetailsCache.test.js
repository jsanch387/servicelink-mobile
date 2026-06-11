import { QueryClient } from '@tanstack/react-query';
import { bookingsDetailsQueryKey } from '../queryKeys';
import { patchBookingOnMyWaySentInDetailsCache } from '../booking-details/utils/patchBookingOnMyWaySentInDetailsCache';

describe('patchBookingOnMyWaySentInDetailsCache', () => {
  it('sets on_my_way_sent_at on the cached details booking', () => {
    const queryClient = new QueryClient();
    const bookingId = 'book-1';
    const sentAt = '2026-06-10T20:00:00.000Z';
    queryClient.setQueryData(bookingsDetailsQueryKey(bookingId), {
      id: bookingId,
      status: 'confirmed',
      on_my_way_sent_at: null,
    });

    patchBookingOnMyWaySentInDetailsCache(queryClient, bookingId, sentAt);

    expect(queryClient.getQueryData(bookingsDetailsQueryKey(bookingId))).toEqual({
      id: bookingId,
      status: 'confirmed',
      on_my_way_sent_at: sentAt,
    });
  });
});

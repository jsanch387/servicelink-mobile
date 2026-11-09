import { QueryClient } from '@tanstack/react-query';
import { bookingsDetailsQueryKey } from '../../queryKeys';
import { patchBookingNotesInDetailsCache } from '../utils/patchBookingNotesInDetailsCache';

describe('patchBookingNotesInDetailsCache', () => {
  it('writes customer_notes onto the details row', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(bookingsDetailsQueryKey('book-1'), {
      id: 'book-1',
      customer_notes: '',
    });

    patchBookingNotesInDetailsCache(queryClient, 'book-1', 'Side gate');

    expect(queryClient.getQueryData(bookingsDetailsQueryKey('book-1'))).toEqual({
      id: 'book-1',
      customer_notes: 'Side gate',
    });
  });
});

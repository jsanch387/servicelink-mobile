import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { bookingsDetailsQueryKey } from '../../queryKeys';
import { updateBookingNotes } from '../api/updateBookingNotes';
import * as invalidateCaches from '../utils/invalidateBookingCachesAfterMutation';
import { useUpdateBookingNotes } from '../hooks/useUpdateBookingNotes';

jest.mock('../api/updateBookingNotes', () => ({
  updateBookingNotes: jest.fn(),
}));

jest.mock('../utils/invalidateBookingCachesAfterMutation', () => ({
  invalidateBookingCachesAfterMutation: jest.fn(() => Promise.resolve()),
}));

describe('useUpdateBookingNotes', () => {
  let queryClient;

  function wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    updateBookingNotes.mockResolvedValue({
      ok: true,
      bookingId: 'book-1',
      notes: 'Side gate',
    });
    queryClient.setQueryData(bookingsDetailsQueryKey('book-1'), {
      id: 'book-1',
      customer_notes: '',
    });
  });

  it('patches details and refreshes booking lists after a save', async () => {
    const { result } = renderHook(() => useUpdateBookingNotes('book-1', 'biz-9'), { wrapper });

    await act(async () => {
      await result.current.saveNotes('Side gate');
    });

    await waitFor(() => {
      expect(updateBookingNotes).toHaveBeenCalledWith('book-1', 'Side gate', 'biz-9');
      expect(queryClient.getQueryData(bookingsDetailsQueryKey('book-1'))).toEqual({
        id: 'book-1',
        customer_notes: 'Side gate',
      });
      expect(invalidateCaches.invalidateBookingCachesAfterMutation).toHaveBeenCalledWith(
        queryClient,
        'book-1',
      );
    });
  });
});

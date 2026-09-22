import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { useAuth } from '../../../../auth';
import { bookingsDetailsQueryKey } from '../../../queryKeys';
import * as invalidateCaches from '../../../booking-details/utils/invalidateBookingCachesAfterMutation';
import { patchBookingAssignee } from '../../api/patchBookingAssignee';
import { usePatchBookingAssignee } from '../usePatchBookingAssignee';

jest.mock('../../../../auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../api/patchBookingAssignee', () => ({
  patchBookingAssignee: jest.fn(),
}));

jest.mock('../../../booking-details/utils/invalidateBookingCachesAfterMutation', () => ({
  invalidateBookingCachesAfterMutation: jest.fn(() => Promise.resolve()),
}));

describe('usePatchBookingAssignee', () => {
  let queryClient;

  function wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    useAuth.mockReturnValue({ session: { access_token: 'token-1' } });
    patchBookingAssignee.mockResolvedValue({
      ok: true,
      bookingId: 'book-1',
      assignedUserId: 'member-1',
    });
    queryClient.setQueryData(bookingsDetailsQueryKey('book-1'), {
      id: 'book-1',
      assigned_user_id: null,
    });
  });

  it('patches details cache and invalidates booking lists after a save', async () => {
    const { result } = renderHook(() => usePatchBookingAssignee('book-1'), { wrapper });

    await act(async () => {
      await result.current.assignBooking('member-1');
    });

    await waitFor(() => {
      expect(patchBookingAssignee).toHaveBeenCalledWith('token-1', 'book-1', 'member-1');
      expect(queryClient.getQueryData(bookingsDetailsQueryKey('book-1'))).toEqual({
        id: 'book-1',
        assigned_user_id: 'member-1',
        assignedUserId: 'member-1',
      });
      expect(invalidateCaches.invalidateBookingCachesAfterMutation).toHaveBeenCalledWith(
        queryClient,
        'book-1',
      );
    });
  });
});

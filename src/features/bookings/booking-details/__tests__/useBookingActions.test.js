jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../../../auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../api/patchCancelAvailabilityBooking', () => ({
  patchCancelAvailabilityBooking: jest.fn(),
}));

jest.mock('../api/bookingDetails', () => ({
  rescheduleBookingById: jest.fn(),
  deleteBookingById: jest.fn(),
}));

jest.mock('../utils/invalidateBookingCachesAfterMutation', () => ({
  invalidateBookingCachesAfterMutation: jest.fn(),
}));

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import { useAuth } from '../../../auth';
import { patchCancelAvailabilityBooking } from '../../api/patchCancelAvailabilityBooking';
import { deleteBookingById, rescheduleBookingById } from '../api/bookingDetails';
import { useBookingActions } from '../hooks/useBookingActions';
import { invalidateBookingCachesAfterMutation } from '../utils/invalidateBookingCachesAfterMutation';

/** Picks the mutation whose `mutationFn` calls `rescheduleBookingById`. */
async function findRescheduleMutationConfig(mutationConfigs) {
  for (const config of mutationConfigs) {
    rescheduleBookingById.mockClear();
    try {
      await config.mutationFn({ scheduledDate: '2026-05-20', startTime: '14:00:00' });
    } catch {
      // wrong mutationFn shape or API throw — try next
    }
    if (rescheduleBookingById.mock.calls.length > 0) {
      return config;
    }
  }
  throw new Error('Expected a reschedule useMutation config');
}

/** Picks the mutation whose `mutationFn` calls `patchCancelAvailabilityBooking`. */
async function findCancelMutationConfig(mutationConfigs) {
  for (const config of mutationConfigs) {
    patchCancelAvailabilityBooking.mockClear();
    try {
      await config.mutationFn();
    } catch {
      // wrong mutationFn shape or API throw — try next
    }
    if (patchCancelAvailabilityBooking.mock.calls.length > 0) {
      return config;
    }
  }
  throw new Error('Expected a cancel useMutation config');
}

describe('useBookingActions', () => {
  const queryClient = {
    id: 'qc-1',
    setQueryData: jest.fn(),
    removeQueries: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ session: { access_token: 'token-1' } });
    patchCancelAvailabilityBooking.mockResolvedValue({
      ok: true,
      booking: { id: 'book-1', status: 'cancelled' },
    });
    rescheduleBookingById.mockResolvedValue({ data: { id: 'book-1' }, error: null });
    deleteBookingById.mockResolvedValue({ data: { id: 'book-1' }, error: null });
  });

  function renderUseBookingActions() {
    const mutationConfigs = [];
    useQueryClient.mockReturnValue(queryClient);
    useMutation.mockImplementation((config) => {
      mutationConfigs.push(config);
      return {
        mutateAsync: jest.fn(),
        isPending: false,
        error: null,
      };
    });
    renderHook(() => useBookingActions('book-1'));
    return mutationConfigs;
  }

  it('cancels via server PATCH and invalidates caches on success', async () => {
    const mutationConfigs = renderUseBookingActions();
    const cancelMutation = await findCancelMutationConfig(mutationConfigs);
    patchCancelAvailabilityBooking.mockClear();

    const booking = await cancelMutation.mutationFn();
    expect(patchCancelAvailabilityBooking).toHaveBeenCalledWith('token-1', 'book-1');
    expect(booking).toEqual({ id: 'book-1', status: 'cancelled' });

    await cancelMutation.onSuccess(booking);
    expect(queryClient.setQueryData).toHaveBeenCalled();
    expect(invalidateBookingCachesAfterMutation).toHaveBeenCalledWith(queryClient, 'book-1');
  });

  it('throws when cancel API fails', async () => {
    patchCancelAvailabilityBooking.mockResolvedValue({
      ok: false,
      error: new Error('Booking not found'),
      httpStatus: 404,
    });

    const mutationConfigs = renderUseBookingActions();
    const cancelMutation = await findCancelMutationConfig(mutationConfigs);

    await expect(cancelMutation.mutationFn()).rejects.toThrow('Booking not found');
  });

  it('uses reschedule API payload and invalidates caches on success', async () => {
    rescheduleBookingById.mockResolvedValue({
      data: { id: 'book-1', scheduled_date: '2026-05-20', start_time: '14:00:00' },
      error: null,
    });

    const mutationConfigs = renderUseBookingActions();
    expect(mutationConfigs.length).toBeGreaterThanOrEqual(3);

    const rescheduleMutation = await findRescheduleMutationConfig(mutationConfigs);
    rescheduleBookingById.mockClear();

    await rescheduleMutation.mutationFn({
      scheduledDate: '2026-05-20',
      startTime: '14:00:00',
    });

    expect(rescheduleBookingById).toHaveBeenCalledWith('book-1', {
      scheduledDate: '2026-05-20',
      startTime: '14:00:00',
    });

    await rescheduleMutation.onSuccess();
    expect(invalidateBookingCachesAfterMutation).toHaveBeenCalledWith(queryClient, 'book-1');
  });

  it('throws friendly error when reschedule API fails', async () => {
    rescheduleBookingById.mockResolvedValue({
      data: null,
      error: { message: 'Update denied' },
    });

    const mutationConfigs = renderUseBookingActions();
    const rescheduleMutation = await findRescheduleMutationConfig(mutationConfigs);

    await expect(
      rescheduleMutation.mutationFn({
        scheduledDate: '2026-05-20',
        startTime: '14:00:00',
      }),
    ).rejects.toThrow('Update denied');
  });

  it('registers cancel, reschedule, and delete mutations without calling APIs on mount', () => {
    renderUseBookingActions();
    expect(patchCancelAvailabilityBooking).not.toHaveBeenCalled();
    expect(rescheduleBookingById).not.toHaveBeenCalled();
    expect(deleteBookingById).not.toHaveBeenCalled();
    expect(useMutation).toHaveBeenCalledTimes(3);
  });
});

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../api/bookingDetails', () => ({
  cancelBookingById: jest.fn(),
  rescheduleBookingById: jest.fn(),
  deleteBookingById: jest.fn(),
}));

jest.mock('../utils/invalidateBookingCachesAfterMutation', () => ({
  invalidateBookingCachesAfterMutation: jest.fn(),
}));

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelBookingById, deleteBookingById, rescheduleBookingById } from '../api/bookingDetails';
import { renderHook } from '@testing-library/react-native';
import { useBookingActions } from '../hooks/useBookingActions';
import { invalidateBookingCachesAfterMutation } from '../utils/invalidateBookingCachesAfterMutation';

/** Picks the mutation whose `mutationFn` calls `rescheduleBookingById` (stable if hook order changes). */
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

describe('useBookingActions reschedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cancelBookingById.mockResolvedValue({ data: { id: 'book-1' }, error: null });
    rescheduleBookingById.mockResolvedValue({ data: { id: 'book-1' }, error: null });
    deleteBookingById.mockResolvedValue({ data: { id: 'book-1' }, error: null });
  });

  function renderUseBookingActions() {
    const mutationConfigs = [];
    useQueryClient.mockReturnValue({ id: 'qc-1' });
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
    expect(invalidateBookingCachesAfterMutation).toHaveBeenCalledWith({ id: 'qc-1' }, 'book-1');
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
    expect(cancelBookingById).not.toHaveBeenCalled();
    expect(rescheduleBookingById).not.toHaveBeenCalled();
    expect(deleteBookingById).not.toHaveBeenCalled();
    expect(useMutation).toHaveBeenCalledTimes(3);
  });
});

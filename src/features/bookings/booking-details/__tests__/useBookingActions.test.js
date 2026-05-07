jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../api/bookingDetails', () => ({
  markBookingCompletedById: jest.fn(),
  cancelBookingById: jest.fn(),
  rescheduleBookingById: jest.fn(),
}));

jest.mock('../utils/invalidateBookingCachesAfterMutation', () => ({
  invalidateBookingCachesAfterMutation: jest.fn(),
}));

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cancelBookingById,
  markBookingCompletedById,
  rescheduleBookingById,
} from '../api/bookingDetails';
import { renderHook } from '@testing-library/react-native';
import { useBookingActions } from '../hooks/useBookingActions';
import { invalidateBookingCachesAfterMutation } from '../utils/invalidateBookingCachesAfterMutation';

describe('useBookingActions reschedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(mutationConfigs).toHaveLength(3);

    const rescheduleMutation = mutationConfigs[2];
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
    const rescheduleMutation = mutationConfigs[2];

    await expect(
      rescheduleMutation.mutationFn({
        scheduledDate: '2026-05-20',
        startTime: '14:00:00',
      }),
    ).rejects.toThrow('Update denied');
  });

  it('keeps existing complete/cancel mutations configured', () => {
    renderUseBookingActions();
    expect(markBookingCompletedById).not.toHaveBeenCalled();
    expect(cancelBookingById).not.toHaveBeenCalled();
    expect(useMutation).toHaveBeenCalledTimes(3);
  });
});

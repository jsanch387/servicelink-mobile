jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../../../auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../api/patchApproveAvailabilityBooking', () => ({
  patchApproveAvailabilityBooking: jest.fn(),
  isAppointmentRequestExpiredError: (error) =>
    String(error?.message ?? '').trim() === 'This request expired.',
}));

jest.mock('../../api/patchDenyAvailabilityBooking', () => ({
  patchDenyAvailabilityBooking: jest.fn(),
}));

jest.mock('../../api/patchCancelAvailabilityBooking', () => ({
  patchCancelAvailabilityBooking: jest.fn(),
}));

jest.mock('../../api/patchRescheduleAvailabilityBooking', () => ({
  patchRescheduleAvailabilityBooking: jest.fn(),
  applyRescheduleDisplayToBookingRow: jest.fn((prev, booking) => ({
    ...prev,
    scheduled_date: booking?.date,
    start_time: '14:00:00',
    status: booking?.status,
  })),
}));

jest.mock('../api/bookingDetails', () => ({
  deleteBookingById: jest.fn(),
}));

jest.mock('../utils/invalidateBookingCachesAfterMutation', () => ({
  invalidateBookingCachesAfterMutation: jest.fn(),
}));

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import { useAuth } from '../../../auth';
import { patchApproveAvailabilityBooking } from '../../api/patchApproveAvailabilityBooking';
import { patchDenyAvailabilityBooking } from '../../api/patchDenyAvailabilityBooking';
import { patchCancelAvailabilityBooking } from '../../api/patchCancelAvailabilityBooking';
import {
  applyRescheduleDisplayToBookingRow,
  patchRescheduleAvailabilityBooking,
} from '../../api/patchRescheduleAvailabilityBooking';
import { deleteBookingById } from '../api/bookingDetails';
import { useBookingActions } from '../hooks/useBookingActions';
import { invalidateBookingCachesAfterMutation } from '../utils/invalidateBookingCachesAfterMutation';

/** Picks the mutation whose `mutationFn` calls `patchRescheduleAvailabilityBooking`. */
async function findRescheduleMutationConfig(mutationConfigs) {
  for (const config of mutationConfigs) {
    patchRescheduleAvailabilityBooking.mockClear();
    try {
      await config.mutationFn({ scheduledDate: '2026-05-20', startTime: '14:00' });
    } catch {
      // wrong mutationFn shape or API throw — try next
    }
    if (patchRescheduleAvailabilityBooking.mock.calls.length > 0) {
      return config;
    }
  }
  throw new Error('Expected a reschedule useMutation config');
}

/** Picks the mutation whose `mutationFn` calls `patchApproveAvailabilityBooking`. */
async function findApproveMutationConfig(mutationConfigs) {
  for (const config of mutationConfigs) {
    patchApproveAvailabilityBooking.mockClear();
    try {
      await config.mutationFn();
    } catch {
      // wrong mutationFn shape or API throw — try next
    }
    if (patchApproveAvailabilityBooking.mock.calls.length > 0) {
      return config;
    }
  }
  throw new Error('Expected an approve useMutation config');
}

/** Picks the mutation whose `mutationFn` calls `patchDenyAvailabilityBooking`. */
async function findDenyMutationConfig(mutationConfigs) {
  for (const config of mutationConfigs) {
    patchDenyAvailabilityBooking.mockClear();
    try {
      await config.mutationFn();
    } catch {
      // wrong mutationFn shape or API throw — try next
    }
    if (patchDenyAvailabilityBooking.mock.calls.length > 0) {
      return config;
    }
  }
  throw new Error('Expected a deny useMutation config');
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
    patchRescheduleAvailabilityBooking.mockResolvedValue({
      ok: true,
      booking: {
        id: 'book-1',
        status: 'confirmed',
        date: '2026-05-20',
        time: '2:00 PM',
        startTimeHHmm: '14:00',
      },
    });
    deleteBookingById.mockResolvedValue({ data: { id: 'book-1' }, error: null });
    patchApproveAvailabilityBooking.mockResolvedValue({
      ok: true,
      booking: { id: 'book-1', status: 'confirmed' },
    });
    patchDenyAvailabilityBooking.mockResolvedValue({
      ok: true,
      booking: { id: 'book-1', status: 'cancelled' },
    });
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

  it('reschedules via server PATCH and replaces the local slot on success', async () => {
    const booking = {
      id: 'book-1',
      status: 'confirmed',
      date: '2026-05-20',
      time: '2:00 PM',
      startTimeHHmm: '14:00',
    };
    patchRescheduleAvailabilityBooking.mockResolvedValue({ ok: true, booking });

    const mutationConfigs = renderUseBookingActions();
    expect(mutationConfigs.length).toBeGreaterThanOrEqual(3);

    const rescheduleMutation = await findRescheduleMutationConfig(mutationConfigs);
    patchRescheduleAvailabilityBooking.mockClear();

    const saved = await rescheduleMutation.mutationFn({
      scheduledDate: '2026-05-20',
      startTime: '14:00',
    });

    expect(patchRescheduleAvailabilityBooking).toHaveBeenCalledWith('token-1', 'book-1', {
      scheduledDate: '2026-05-20',
      startTime: '14:00',
    });
    expect(saved).toEqual(booking);

    queryClient.setQueryData.mockImplementation((_key, updater) => {
      updater({ id: 'book-1', scheduled_date: '2026-05-01', start_time: '09:00:00' });
    });
    await rescheduleMutation.onSuccess(booking);
    expect(applyRescheduleDisplayToBookingRow).toHaveBeenCalled();
    expect(invalidateBookingCachesAfterMutation).toHaveBeenCalledWith(queryClient, 'book-1');
  });

  it('throws the server error when reschedule API fails', async () => {
    patchRescheduleAvailabilityBooking.mockResolvedValue({
      ok: false,
      error: new Error('Only confirmed appointments can be rescheduled.'),
      httpStatus: 409,
    });

    const mutationConfigs = renderUseBookingActions();
    const rescheduleMutation = await findRescheduleMutationConfig(mutationConfigs);

    await expect(
      rescheduleMutation.mutationFn({
        scheduledDate: '2026-05-20',
        startTime: '14:00',
      }),
    ).rejects.toThrow('Only confirmed appointments can be rescheduled.');
  });

  it('registers cancel, reschedule, and delete mutations without calling APIs on mount', () => {
    renderUseBookingActions();
    expect(patchApproveAvailabilityBooking).not.toHaveBeenCalled();
    expect(patchDenyAvailabilityBooking).not.toHaveBeenCalled();
    expect(patchCancelAvailabilityBooking).not.toHaveBeenCalled();
    expect(patchRescheduleAvailabilityBooking).not.toHaveBeenCalled();
    expect(deleteBookingById).not.toHaveBeenCalled();
    expect(useMutation).toHaveBeenCalledTimes(5);
  });

  it('approves via server PATCH and marks the open booking confirmed', async () => {
    const mutationConfigs = renderUseBookingActions();
    const approveMutation = await findApproveMutationConfig(mutationConfigs);
    patchApproveAvailabilityBooking.mockClear();

    const booking = await approveMutation.mutationFn();
    expect(patchApproveAvailabilityBooking).toHaveBeenCalledWith('token-1', 'book-1');
    expect(booking).toEqual({ id: 'book-1', status: 'confirmed' });

    await approveMutation.onSuccess(booking);
    expect(queryClient.setQueryData).toHaveBeenCalled();
    const updater = queryClient.setQueryData.mock.calls.at(-1)[1];
    expect(updater({ id: 'book-1', status: 'requested' })).toEqual({
      id: 'book-1',
      status: 'confirmed',
    });
    expect(invalidateBookingCachesAfterMutation).toHaveBeenCalledWith(queryClient, 'book-1');
  });

  it('marks an expired request locally when approve returns the expiry error', async () => {
    patchApproveAvailabilityBooking.mockResolvedValue({
      ok: false,
      error: new Error('This request expired.'),
      httpStatus: 409,
    });

    const mutationConfigs = renderUseBookingActions();
    const approveMutation = await findApproveMutationConfig(mutationConfigs);

    await expect(approveMutation.mutationFn()).rejects.toThrow('This request expired.');
    await approveMutation.onError(new Error('This request expired.'));

    const updater = queryClient.setQueryData.mock.calls.at(-1)[1];
    expect(updater({ id: 'book-1', status: 'requested' })).toEqual({
      id: 'book-1',
      status: 'expired',
    });
    expect(invalidateBookingCachesAfterMutation).toHaveBeenCalledWith(queryClient, 'book-1');
  });

  it('leaves the request unchanged in cache when approve fails for another reason', async () => {
    patchApproveAvailabilityBooking.mockResolvedValue({
      ok: false,
      error: new Error('Forbidden'),
      httpStatus: 403,
    });

    const mutationConfigs = renderUseBookingActions();
    const approveMutation = await findApproveMutationConfig(mutationConfigs);
    queryClient.setQueryData.mockClear();

    await expect(approveMutation.mutationFn()).rejects.toThrow('Forbidden');
    await approveMutation.onError(new Error('Forbidden'));
    expect(queryClient.setQueryData).not.toHaveBeenCalled();
  });

  it('denies via server PATCH and marks the open booking cancelled', async () => {
    const mutationConfigs = renderUseBookingActions();
    const denyMutation = await findDenyMutationConfig(mutationConfigs);
    patchDenyAvailabilityBooking.mockClear();

    const booking = await denyMutation.mutationFn();
    expect(patchDenyAvailabilityBooking).toHaveBeenCalledWith('token-1', 'book-1');
    expect(booking).toEqual({ id: 'book-1', status: 'cancelled' });

    await denyMutation.onSuccess(booking);
    const updater = queryClient.setQueryData.mock.calls.at(-1)[1];
    expect(updater({ id: 'book-1', status: 'requested' })).toEqual({
      id: 'book-1',
      status: 'cancelled',
    });
    expect(invalidateBookingCachesAfterMutation).toHaveBeenCalledWith(queryClient, 'book-1');
  });

  it('marks an expired request locally when deny returns the expiry error', async () => {
    patchDenyAvailabilityBooking.mockResolvedValue({
      ok: false,
      error: new Error('This request expired.'),
      httpStatus: 409,
    });

    const mutationConfigs = renderUseBookingActions();
    const denyMutation = await findDenyMutationConfig(mutationConfigs);

    await expect(denyMutation.mutationFn()).rejects.toThrow('This request expired.');
    await denyMutation.onError(new Error('This request expired.'));

    const updater = queryClient.setQueryData.mock.calls.at(-1)[1];
    expect(updater({ id: 'book-1', status: 'requested' })).toEqual({
      id: 'book-1',
      status: 'expired',
    });
  });
});

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../../auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../components/ui', () => ({
  useToast: jest.fn(),
}));

jest.mock('../api/postBookingAction', () => ({
  postBookingAction: jest.fn(),
}));

jest.mock('../utils/bookingActionFeedback', () => ({
  showBookingActionToasts: jest.fn(),
}));

jest.mock('../utils/patchBookingJobStatusInHomeCache', () => ({
  patchBookingJobStatusInHomeCache: jest.fn(),
}));

jest.mock('../utils/patchBookingJobStatusInDetailsCache', () => ({
  patchBookingJobStatusInDetailsCache: jest.fn(),
}));

jest.mock('../utils/invalidateBookingCachesAfterAction', () => ({
  invalidateBookingCachesAfterAction: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import { useAuth } from '../../auth';
import { useToast } from '../../../components/ui';
import { postBookingAction } from '../api/postBookingAction';
import { BOOKING_ACTION } from '../constants/jobStatus';
import { useBookingAction } from '../hooks/useBookingAction';
import { showBookingActionToasts } from '../utils/bookingActionFeedback';
import { patchBookingJobStatusInDetailsCache } from '../utils/patchBookingJobStatusInDetailsCache';
import { patchBookingJobStatusInHomeCache } from '../utils/patchBookingJobStatusInHomeCache';
import { invalidateBookingCachesAfterAction } from '../utils/invalidateBookingCachesAfterAction';

describe('useBookingAction work_finished', () => {
  /** @type {import('@tanstack/react-query').UseMutationOptions | undefined} */
  let mutationConfig;
  const toast = { error: jest.fn() };
  const queryClient = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mutationConfig = undefined;
    useAuth.mockReturnValue({ session: { access_token: 'token-1' } });
    useToast.mockReturnValue(toast);
    useQueryClient.mockReturnValue(queryClient);
    useMutation.mockImplementation((config) => {
      mutationConfig = config;
      return {
        mutate: jest.fn(),
        isPending: false,
      };
    });
  });

  function renderActionHook() {
    renderHook(() => useBookingAction('biz-1'));
    if (!mutationConfig) {
      throw new Error('Expected useMutation config');
    }
    return mutationConfig;
  }

  it('patches caches and shows toast on Done success', async () => {
    const config = renderActionHook();
    const res = {
      ok: true,
      jobStatus: 'in_progress',
      bookingStatus: null,
      workHandoffStatus: 'notified',
      smsSent: true,
      smsReason: null,
    };

    await act(async () => {
      await config.onSuccess(res, {
        bookingId: 'book-1',
        action: BOOKING_ACTION.WORK_FINISHED,
        notify: true,
      });
    });

    expect(patchBookingJobStatusInHomeCache).toHaveBeenCalledWith(
      queryClient,
      'biz-1',
      'book-1',
      'in_progress',
      null,
      'notified',
    );
    expect(patchBookingJobStatusInDetailsCache).toHaveBeenCalledWith(
      queryClient,
      'book-1',
      'in_progress',
      null,
      'notified',
    );
    expect(invalidateBookingCachesAfterAction).toHaveBeenCalledWith(queryClient, 'book-1');
    expect(showBookingActionToasts).toHaveBeenCalledWith(toast, BOOKING_ACTION.WORK_FINISHED, res);
  });

  it('patches caches without toast on Skip success', async () => {
    const config = renderActionHook();
    const res = {
      ok: true,
      jobStatus: 'in_progress',
      bookingStatus: null,
      workHandoffStatus: 'skipped',
      smsSent: false,
      smsReason: null,
    };

    await act(async () => {
      await config.onSuccess(res, {
        bookingId: 'book-1',
        action: BOOKING_ACTION.WORK_FINISHED,
        notify: false,
      });
    });

    expect(patchBookingJobStatusInHomeCache).toHaveBeenCalledWith(
      queryClient,
      'biz-1',
      'book-1',
      'in_progress',
      null,
      'skipped',
    );
    expect(showBookingActionToasts).not.toHaveBeenCalled();
  });

  it('shows error toast when action fails', async () => {
    const config = renderActionHook();

    await act(async () => {
      await config.onSuccess(
        {
          ok: false,
          httpStatus: 500,
          error: { message: 'Server blew up' },
        },
        {
          bookingId: 'book-1',
          action: BOOKING_ACTION.WORK_FINISHED,
          notify: true,
        },
      );
    });

    expect(patchBookingJobStatusInHomeCache).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Server blew up');
  });

  it('posts work_finished with notify through mutationFn', async () => {
    postBookingAction.mockResolvedValue({ ok: true, jobStatus: 'in_progress' });
    const config = renderActionHook();

    await config.mutationFn({
      bookingId: 'book-1',
      action: BOOKING_ACTION.WORK_FINISHED,
      notify: true,
    });

    expect(postBookingAction).toHaveBeenCalledWith(
      'token-1',
      'book-1',
      BOOKING_ACTION.WORK_FINISHED,
      { notify: true },
    );
  });
});

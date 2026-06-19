jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../../../auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../../components/ui', () => ({
  useToast: jest.fn(),
}));

jest.mock('../../../appReview', () => ({
  useAppReviewPrompt: jest.fn(),
}));

jest.mock('../../api/postBookingAction', () => ({
  postBookingAction: jest.fn(),
}));

jest.mock('../../utils/bookingActionFeedback', () => ({
  showBookingActionToasts: jest.fn(),
}));

jest.mock('../../utils/patchBookingJobStatusInHomeCache', () => ({
  patchBookingJobStatusInHomeCache: jest.fn(),
}));

jest.mock('../../utils/patchBookingJobStatusInDetailsCache', () => ({
  patchBookingJobStatusInDetailsCache: jest.fn(),
}));

jest.mock('../utils/invalidateBookingCachesAfterMutation', () => ({
  invalidateBookingCachesAfterMutation: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success' },
}));

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import { useAuth } from '../../../auth';
import { useToast } from '../../../../components/ui';
import { useAppReviewPrompt } from '../../../appReview';
import { postBookingAction } from '../../api/postBookingAction';
import { BOOKING_ACTION } from '../../constants/jobStatus';
import { showBookingActionToasts } from '../../utils/bookingActionFeedback';
import { patchBookingJobStatusInDetailsCache } from '../../utils/patchBookingJobStatusInDetailsCache';
import { patchBookingJobStatusInHomeCache } from '../../utils/patchBookingJobStatusInHomeCache';
import { useMarkBookingCompleteFlow } from '../hooks/useMarkBookingCompleteFlow';
import { invalidateBookingCachesAfterMutation } from '../utils/invalidateBookingCachesAfterMutation';

describe('useMarkBookingCompleteFlow', () => {
  /** @type {import('@tanstack/react-query').UseMutationOptions | undefined} */
  let mutationConfig;
  const toast = { sms: jest.fn(), email: jest.fn(), success: jest.fn(), info: jest.fn() };
  const queryClient = { getQueryData: jest.fn(() => null), setQueryData: jest.fn() };
  const maybeRequestAppReview = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mutationConfig = undefined;
    useAuth.mockReturnValue({ session: { access_token: 'token-1' }, user: { id: 'user-1' } });
    useToast.mockReturnValue(toast);
    useQueryClient.mockReturnValue(queryClient);
    useAppReviewPrompt.mockReturnValue({ maybeRequestAppReview });
    useMutation.mockImplementation((config) => {
      mutationConfig = config;
      return {
        mutateAsync: (vars) => config.mutationFn(vars),
        isPending: false,
        error: null,
      };
    });
  });

  function renderFlowHook(bookingId = 'booking-1') {
    renderHook(() => useMarkBookingCompleteFlow(bookingId, { businessId: 'biz-1' }));
    if (!mutationConfig) {
      throw new Error('Expected useMutation config');
    }
    return mutationConfig;
  }

  it('posts job_completed with checkout payload from confirmComplete', async () => {
    postBookingAction.mockResolvedValue({
      ok: true,
      jobStatus: 'completed',
      bookingStatus: 'completed',
      workHandoffStatus: 'notified',
      invoicePublicToken: 'inv-token-1',
      smsSent: true,
      smsReason: null,
      emailSent: false,
      emailReason: null,
      messageId: 'sms-1',
    });

    const { result } = renderHook(() =>
      useMarkBookingCompleteFlow('booking-1', { businessId: 'biz-1' }),
    );

    await act(async () => {
      await result.current.confirmComplete({
        sessionFees: [{ label: 'Pet hair', amount: 25 }],
        sessionPayment: { method: 'cash', amount: 120, stripePaymentIntentId: null },
      });
    });

    expect(postBookingAction).toHaveBeenCalledWith(
      'token-1',
      'booking-1',
      BOOKING_ACTION.JOB_COMPLETED,
      {
        sessionFees: [{ label: 'Pet hair', amountCents: 2500 }],
        sessionPayment: { method: 'cash', amountCents: 12000 },
      },
    );
  });

  it('patches caches and shows toast on job_completed success', async () => {
    const config = renderFlowHook();
    const payload = {
      mode: 'job_completed',
      result: {
        ok: true,
        jobStatus: 'completed',
        bookingStatus: 'completed',
        workHandoffStatus: 'skipped',
        invoicePublicToken: 'inv-abc',
        smsSent: true,
        smsReason: null,
        emailSent: false,
        emailReason: null,
        messageId: 'sms-2',
      },
    };

    await act(async () => {
      await config.onSuccess(payload);
    });

    expect(patchBookingJobStatusInHomeCache).toHaveBeenCalledWith(
      queryClient,
      'biz-1',
      'booking-1',
      'completed',
      'completed',
    );
    expect(patchBookingJobStatusInDetailsCache).toHaveBeenCalledWith(
      queryClient,
      'booking-1',
      'completed',
      'completed',
    );
    expect(invalidateBookingCachesAfterMutation).toHaveBeenCalledWith(queryClient, 'booking-1');
    expect(showBookingActionToasts).toHaveBeenCalledWith(
      toast,
      BOOKING_ACTION.JOB_COMPLETED,
      payload.result,
    );
    expect(maybeRequestAppReview).toHaveBeenCalledWith({ businessId: 'biz-1' });
  });

  it('throws when postBookingAction returns not ok', async () => {
    postBookingAction.mockResolvedValue({
      ok: false,
      error: new Error('Payment is still due on this booking.'),
      httpStatus: 400,
    });

    const config = renderFlowHook();

    await expect(
      config.mutationFn({
        sessionFees: [],
        sessionPayment: null,
      }),
    ).rejects.toThrow('Payment is still due on this booking.');
  });
});

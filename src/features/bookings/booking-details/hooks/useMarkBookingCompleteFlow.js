import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../../../../components/ui';
import { useAppReviewPrompt } from '../../../appReview';
import { useAuth } from '../../../auth';
import { fetchBusinessProfileForUser } from '../../../home/api/homeDashboard';
import { loadReviewEligibilityContext } from '../../../reviews/api/loadReviewEligibilityContext';
import { getMarkCompleteModalCopy } from '../../../reviews/utils/reviewInviteEligibility';
import { postBookingAction } from '../../api/postBookingAction';
import { BOOKING_ACTION } from '../../constants/jobStatus';
import { bookingsDetailsQueryKey } from '../../queryKeys';
import { showBookingActionToasts } from '../../utils/bookingActionFeedback';
import { patchBookingJobStatusInDetailsCache } from '../../utils/patchBookingJobStatusInDetailsCache';
import { patchBookingJobStatusInHomeCache } from '../../utils/patchBookingJobStatusInHomeCache';
import { completeBookingWithReviewInvite } from '../api/completeBookingWithReviewInvite';
import { fetchBookingDetailsById } from '../api/bookingDetails';
import {
  MARK_COMPLETE_USE_COMPLETE_VISIT_SCREEN,
  MARK_COMPLETE_USE_JOB_COMPLETED_ACTION,
} from '../constants/markCompleteFeatureFlags';
import { buildCompleteVisitModelFromBooking } from '../utils/buildCompleteVisitModel';
import { buildJobCompletedPayload } from '../utils/buildJobCompletedPayload';
import { invalidateBookingCachesAfterMutation } from '../utils/invalidateBookingCachesAfterMutation';
import { getMarkCompletePreviewFromBooking } from '../utils/markCompletePreview';

/**
 * @typedef {import('../../../reviews/utils/reviewInviteEligibility').BookingForReviewEligibility} BookingForReviewEligibility
 * @typedef {import('../../../reviews/utils/reviewInviteEligibility').ReviewEligibilityContext} ReviewEligibilityContext
 * @typedef {import('../utils/markCompletePreview').MarkCompletePreview} MarkCompletePreview
 */

/**
 * @param {{
 *   bookingId: string | null | undefined;
 *   optionId?: string | null;
 *   customerId?: string | null;
 *   customerEmail?: string | null;
 *   customerPhone?: string | null;
 *   customerName?: string | null;
 * }} params
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @returns {(BookingForReviewEligibility & { customer_phone?: string | null; customer_name?: string | null }) | null}
 */
function resolveBookingForFlow(
  { bookingId, optionId, customerId, customerEmail, customerPhone, customerName },
  queryClient,
) {
  const resolvedId = optionId?.trim() || bookingId?.trim();
  if (!resolvedId) {
    return null;
  }

  if (optionId?.trim()) {
    return {
      id: resolvedId,
      customer_id: customerId ?? null,
      customer_email: customerEmail ?? null,
      customer_phone: customerPhone ?? null,
      customer_name: customerName ?? null,
    };
  }

  const cached = queryClient.getQueryData(bookingsDetailsQueryKey(resolvedId));
  if (cached && typeof cached === 'object') {
    return {
      id: String(cached.id ?? resolvedId).trim(),
      customer_id: cached.customer_id ?? null,
      customer_email: cached.customer_email ?? null,
      customer_phone: cached.customer_phone ?? null,
      customer_name: cached.customer_name ?? null,
    };
  }

  return {
    id: resolvedId,
    customer_id: customerId ?? null,
    customer_email: customerEmail ?? null,
    customer_phone: customerPhone ?? null,
    customer_name: customerName ?? null,
  };
}

/**
 * Mark-complete confirm sheet + submit.
 *
 * When {@link MARK_COMPLETE_USE_JOB_COMPLETED_ACTION} is true, preview is phone-based (SMS review link)
 * and confirm calls `POST …/actions` with `job_completed`. Otherwise legacy Supabase complete + review email.
 *
 * @param {string | null | undefined} bookingId
 * @param {{
 *   booking?: (BookingForReviewEligibility & { customer_phone?: string | null }) | null;
 *   businessId?: string | null;
 * }} [options]
 */
export function useMarkBookingCompleteFlow(bookingId, options = {}) {
  const { booking: bookingOption = null, businessId: businessIdOption = null } = options;
  const useJobCompletedAction = MARK_COMPLETE_USE_JOB_COMPLETED_ACTION;
  const useCompleteVisitScreen = MARK_COMPLETE_USE_COMPLETE_VISIT_SCREEN;
  const optionBookingId = bookingOption?.id?.trim() || null;
  const optionCustomerId = bookingOption?.customer_id?.trim() || null;
  const optionCustomerEmail =
    typeof bookingOption?.customer_email === 'string' ? bookingOption.customer_email : null;
  const optionCustomerPhone =
    typeof bookingOption?.customer_phone === 'string' ? bookingOption.customer_phone : null;
  const optionCustomerName =
    typeof bookingOption?.customer_name === 'string' ? bookingOption.customer_name : null;
  const normalizedBusinessId = businessIdOption?.trim() || null;

  const { session, user } = useAuth();
  const accessToken = session?.access_token ?? null;
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const toast = useToast();
  const { maybeRequestAppReview } = useAppReviewPrompt();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [preview, setPreview] = useState(
    /** @type {MarkCompletePreview | { showReviewInviteMessage: boolean } | null} */ (null),
  );
  const [eligibilityCtx, setEligibilityCtx] = useState(
    /** @type {ReviewEligibilityContext | null} */ (null),
  );
  const [resolvedBooking, setResolvedBooking] = useState(
    /** @type {(BookingForReviewEligibility & { customer_phone?: string | null }) | null} */ (null),
  );
  const [resolvedBusinessId, setResolvedBusinessId] = useState(/** @type {string | null} */ (null));
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(/** @type {string | null} */ (null));
  const [completeVisitModel, setCompleteVisitModel] = useState(
    /** @type {import('../utils/buildCompleteVisitModel').CompleteVisitModel | null} */ (null),
  );
  const loadGenerationRef = useRef(0);

  const resolveCurrentBooking = useCallback(() => {
    return resolveBookingForFlow(
      {
        bookingId,
        optionId: optionBookingId,
        customerId: optionCustomerId,
        customerEmail: optionCustomerEmail,
        customerPhone: optionCustomerPhone,
        customerName: optionCustomerName,
      },
      queryClient,
    );
  }, [
    bookingId,
    optionBookingId,
    optionCustomerEmail,
    optionCustomerId,
    optionCustomerName,
    optionCustomerPhone,
    queryClient,
  ]);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setPreviewError(null);
    setCompleteVisitModel(null);
  }, []);

  const openSheet = useCallback(() => {
    if (!bookingId?.trim()) {
      return;
    }
    setSheetVisible(true);
    setPreview(null);
    setPreviewError(null);
    setCompleteVisitModel(null);
    setEligibilityCtx(null);
    setResolvedBooking(resolveCurrentBooking());
    setResolvedBusinessId(normalizedBusinessId);
  }, [bookingId, normalizedBusinessId, resolveCurrentBooking]);

  useEffect(() => {
    if (!sheetVisible || !bookingId?.trim()) {
      return undefined;
    }

    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;
    let cancelled = false;

    setIsLoadingPreview(true);
    setPreviewError(null);

    void (async () => {
      const booking = resolveCurrentBooking();
      if (!booking || cancelled || loadGenerationRef.current !== generation) {
        return;
      }
      setResolvedBooking(booking);

      if (useJobCompletedAction) {
        const nextPreview = getMarkCompletePreviewFromBooking(booking);
        setPreview(nextPreview);

        if (useCompleteVisitScreen) {
          const { data, error } = await fetchBookingDetailsById(booking.id);
          if (cancelled || loadGenerationRef.current !== generation) {
            return;
          }
          if (error || !data) {
            setIsLoadingPreview(false);
            setPreviewError(error?.message ?? 'Could not load booking details.');
            return;
          }
          queryClient.setQueryData(bookingsDetailsQueryKey(booking.id), data);

          const model = buildCompleteVisitModelFromBooking(data, nextPreview);
          if (!model) {
            setIsLoadingPreview(false);
            setPreviewError('Could not prepare the visit receipt.');
            return;
          }
          setCompleteVisitModel(model);
        }

        setIsLoadingPreview(false);
        return;
      }

      let businessId = normalizedBusinessId || '';
      if (!businessId) {
        if (!userId) {
          setIsLoadingPreview(false);
          setPreviewError('Sign in again to complete this booking.');
          return;
        }
        const { data: profile, error: profileError } = await fetchBusinessProfileForUser(userId);
        if (cancelled || loadGenerationRef.current !== generation) {
          return;
        }
        if (profileError || !profile?.id) {
          setIsLoadingPreview(false);
          setPreviewError(profileError?.message ?? 'Could not load your business profile.');
          return;
        }
        businessId = profile.id;
      }

      setResolvedBusinessId(businessId);

      const { data: ctx, error: ctxError } = await loadReviewEligibilityContext(businessId, [
        booking,
      ]);
      if (cancelled || loadGenerationRef.current !== generation) {
        return;
      }

      setIsLoadingPreview(false);

      if (ctxError || !ctx) {
        setPreviewError(ctxError?.message ?? 'Could not load review eligibility.');
        return;
      }

      setEligibilityCtx(ctx);
      setPreview(getMarkCompleteModalCopy(booking, ctx));
    })();

    return () => {
      cancelled = true;
    };
  }, [
    bookingId,
    normalizedBusinessId,
    queryClient,
    resolveCurrentBooking,
    sheetVisible,
    useJobCompletedAction,
    useCompleteVisitScreen,
    userId,
  ]);

  const confirmMutation = useMutation({
    mutationFn: async (
      /** @type {import('../utils/buildJobCompletedPayload').CompleteVisitCheckoutState | undefined} */ checkout,
    ) => {
      if (!bookingId?.trim()) {
        throw new Error('Missing booking id');
      }
      if (!accessToken) {
        throw new Error('Not signed in');
      }

      if (useJobCompletedAction) {
        const jobCompletedBody = checkout ? buildJobCompletedPayload(checkout) : null;
        const result = await postBookingAction(
          accessToken,
          bookingId.trim(),
          BOOKING_ACTION.JOB_COMPLETED,
          jobCompletedBody
            ? {
                sessionFees: jobCompletedBody.sessionFees,
                sessionPayment: jobCompletedBody.sessionPayment,
              }
            : undefined,
        );
        if (!result.ok) {
          throw result.error;
        }
        return { mode: /** @type {const} */ ('job_completed'), result };
      }

      const booking = resolvedBooking ?? resolveCurrentBooking();
      const ctx = eligibilityCtx;
      const businessId = resolvedBusinessId?.trim() || normalizedBusinessId || null;

      if (!booking || !ctx) {
        throw new Error('Review eligibility is still loading. Try again.');
      }
      if (!businessId) {
        throw new Error('Missing business id');
      }

      const result = await completeBookingWithReviewInvite({
        accessToken,
        bookingId: booking.id,
        businessId,
        booking,
        eligibilityCtx: ctx,
      });
      if (!result.ok) {
        throw result.error;
      }
      return { mode: /** @type {const} */ ('legacy'), result: result.data };
    },
    onSuccess: async (payload) => {
      if (payload.mode === 'job_completed') {
        const { result } = payload;
        const id = bookingId?.trim();
        const businessId = resolvedBusinessId ?? normalizedBusinessId;
        if (id && result.jobStatus) {
          patchBookingJobStatusInHomeCache(
            queryClient,
            businessId,
            id,
            result.jobStatus,
            result.bookingStatus,
          );
          patchBookingJobStatusInDetailsCache(
            queryClient,
            id,
            result.jobStatus,
            result.bookingStatus,
          );
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        showBookingActionToasts(toast, BOOKING_ACTION.JOB_COMPLETED, result);
      }

      if (bookingId) {
        await invalidateBookingCachesAfterMutation(queryClient, bookingId);
      }
      if (!useCompleteVisitScreen) {
        closeSheet();
      }
      void maybeRequestAppReview({ businessId: resolvedBusinessId ?? normalizedBusinessId });
    },
  });

  const confirmComplete = useCallback(
    async (
      /** @type {import('../utils/buildJobCompletedPayload').CompleteVisitCheckoutState | undefined} */ checkout,
    ) => {
      await confirmMutation.mutateAsync(checkout);
    },
    [confirmMutation],
  );

  return {
    sheetVisible,
    openSheet,
    closeSheet,
    preview,
    completeVisitModel,
    useCompleteVisitScreen,
    isLoadingPreview,
    previewError,
    confirmComplete,
    isConfirming: confirmMutation.isPending,
    confirmError: confirmMutation.error?.message ?? null,
  };
}

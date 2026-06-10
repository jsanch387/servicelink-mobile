import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppReviewPrompt } from '../../../appReview';
import { useAuth } from '../../../auth';
import { fetchBusinessProfileForUser } from '../../../home/api/homeDashboard';
import { loadReviewEligibilityContext } from '../../../reviews/api/loadReviewEligibilityContext';
import { getMarkCompleteModalCopy } from '../../../reviews/utils/reviewInviteEligibility';
import { bookingsDetailsQueryKey } from '../../queryKeys';
import { completeBookingWithReviewInvite } from '../api/completeBookingWithReviewInvite';
import { invalidateBookingCachesAfterMutation } from '../utils/invalidateBookingCachesAfterMutation';

/**
 * @typedef {import('../../../reviews/utils/reviewInviteEligibility').BookingForReviewEligibility} BookingForReviewEligibility
 * @typedef {import('../../../reviews/utils/reviewInviteEligibility').ReviewEligibilityContext} ReviewEligibilityContext
 */

/**
 * @param {{
 *   bookingId: string | null | undefined;
 *   optionId?: string | null;
 *   customerId?: string | null;
 *   customerEmail?: string | null;
 * }} params
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @returns {BookingForReviewEligibility | null}
 */
function resolveBookingForFlow({ bookingId, optionId, customerId, customerEmail }, queryClient) {
  const resolvedId = optionId?.trim() || bookingId?.trim();
  if (!resolvedId) {
    return null;
  }

  if (optionId?.trim()) {
    return {
      id: resolvedId,
      customer_id: customerId ?? null,
      customer_email: customerEmail ?? null,
    };
  }

  const cached = queryClient.getQueryData(bookingsDetailsQueryKey(resolvedId));
  if (cached && typeof cached === 'object') {
    return {
      id: String(cached.id ?? resolvedId).trim(),
      customer_id: cached.customer_id ?? null,
      customer_email: cached.customer_email ?? null,
    };
  }

  return {
    id: resolvedId,
    customer_id: customerId ?? null,
    customer_email: customerEmail ?? null,
  };
}

/**
 * Opens mark-complete sheet, loads eligibility from Supabase, confirms via Supabase complete + review-invite API.
 *
 * @param {string | null | undefined} bookingId
 * @param {{
 *   booking?: BookingForReviewEligibility | null;
 *   businessId?: string | null;
 * }} [options]
 */
export function useMarkBookingCompleteFlow(bookingId, options = {}) {
  const { booking: bookingOption = null, businessId: businessIdOption = null } = options;
  const optionBookingId = bookingOption?.id?.trim() || null;
  const optionCustomerId = bookingOption?.customer_id?.trim() || null;
  const optionCustomerEmail =
    typeof bookingOption?.customer_email === 'string' ? bookingOption.customer_email : null;
  const normalizedBusinessId = businessIdOption?.trim() || null;

  const { session, user } = useAuth();
  const accessToken = session?.access_token ?? null;
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const { maybeRequestAppReview } = useAppReviewPrompt();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [preview, setPreview] = useState(
    /** @type {{ showReviewInviteMessage: boolean } | null} */ (null),
  );
  const [eligibilityCtx, setEligibilityCtx] = useState(
    /** @type {ReviewEligibilityContext | null} */ (null),
  );
  const [resolvedBooking, setResolvedBooking] = useState(
    /** @type {BookingForReviewEligibility | null} */ (null),
  );
  const [resolvedBusinessId, setResolvedBusinessId] = useState(/** @type {string | null} */ (null));
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(/** @type {string | null} */ (null));
  const loadGenerationRef = useRef(0);

  const resolveCurrentBooking = useCallback(() => {
    return resolveBookingForFlow(
      {
        bookingId,
        optionId: optionBookingId,
        customerId: optionCustomerId,
        customerEmail: optionCustomerEmail,
      },
      queryClient,
    );
  }, [bookingId, optionBookingId, optionCustomerEmail, optionCustomerId, queryClient]);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setPreviewError(null);
  }, []);

  const openSheet = useCallback(() => {
    if (!bookingId?.trim()) {
      return;
    }
    setSheetVisible(true);
    setPreview(null);
    setPreviewError(null);
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
  }, [bookingId, normalizedBusinessId, resolveCurrentBooking, sheetVisible, userId]);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId?.trim()) {
        throw new Error('Missing booking id');
      }
      if (!accessToken) {
        throw new Error('Not signed in');
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
      return result.data;
    },
    onSuccess: async () => {
      if (bookingId) {
        await invalidateBookingCachesAfterMutation(queryClient, bookingId);
      }
      closeSheet();
      // Happy moment: a completed visit. Fire-and-forget; the hook delays internally
      // so the sheet finishes dismissing, and OS quotas cap how often it shows.
      void maybeRequestAppReview({ businessId: resolvedBusinessId ?? normalizedBusinessId });
    },
  });

  const confirmComplete = useCallback(async () => {
    await confirmMutation.mutateAsync();
  }, [confirmMutation]);

  return {
    sheetVisible,
    openSheet,
    closeSheet,
    preview,
    isLoadingPreview,
    previewError,
    confirmComplete,
    isConfirming: confirmMutation.isPending,
    confirmError: confirmMutation.error?.message ?? null,
  };
}

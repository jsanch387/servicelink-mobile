import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import { loadReviewEligibilityContext } from '../../reviews/api/loadReviewEligibilityContext';
import { completeBookingWithReviewInvite } from '../../bookings/booking-details/api/completeBookingWithReviewInvite';
import { invalidateBookingCachesAfterMutation } from '../../bookings/booking-details/utils/invalidateBookingCachesAfterMutation';

/**
 * @typedef {import('../../reviews/utils/reviewInviteEligibility').BookingForReviewEligibility} BookingForReviewEligibility
 */

/**
 * Mark complete via Supabase + optional review-invite API (same as booking details sheet confirm).
 * Prefer {@link useMarkBookingCompleteFlow} when you need the confirm sheet.
 *
 * @param {string} businessId
 */
export function useHomeQuickMarkComplete(businessId) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;

  return useMutation({
    mutationFn: async (booking) => {
      const bookingRow = /** @type {BookingForReviewEligibility} */ (booking);
      if (!bookingRow?.id?.trim()) {
        throw new Error('Missing booking id');
      }
      if (!businessId?.trim()) {
        throw new Error('Missing business id');
      }
      if (!accessToken) {
        throw new Error('Not signed in');
      }

      const { data: ctx, error: ctxError } = await loadReviewEligibilityContext(businessId, [
        bookingRow,
      ]);
      if (ctxError || !ctx) {
        throw new Error(ctxError?.message ?? 'Could not load review eligibility.');
      }

      const result = await completeBookingWithReviewInvite({
        accessToken,
        bookingId: bookingRow.id,
        businessId,
        booking: bookingRow,
        eligibilityCtx: ctx,
      });
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: async (_data, booking) => {
      const bookingId = booking?.id;
      if (bookingId) {
        await invalidateBookingCachesAfterMutation(queryClient, bookingId);
      }
    },
  });
}

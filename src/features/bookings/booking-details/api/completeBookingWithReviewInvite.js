import { willSendReviewInviteOnComplete } from '../../../reviews/utils/reviewInviteEligibility';
import { markBookingCompletedById } from './bookingDetails';
import { postReviewInviteForBooking } from './postReviewInviteForBooking';

/**
 * @typedef {import('../../../reviews/utils/reviewInviteEligibility').BookingForReviewEligibility} BookingForReviewEligibility
 * @typedef {import('../../../reviews/utils/reviewInviteEligibility').ReviewEligibilityContext} ReviewEligibilityContext
 */

/**
 * @typedef {object} CompleteBookingWithReviewInviteResult
 * @property {string} id
 * @property {string} status
 * @property {boolean} reviewInviteSent
 */

/**
 * Marks booking complete in Supabase, then best-effort review-invite email when eligible.
 * Does not roll back completion if the invite API fails.
 *
 * @param {{
 *   accessToken: string | null | undefined;
 *   bookingId: string;
 *   businessId?: string | null;
 *   booking: BookingForReviewEligibility;
 *   eligibilityCtx: ReviewEligibilityContext;
 * }} params
 * @returns {Promise<
 *   | { ok: true; data: CompleteBookingWithReviewInviteResult }
 *   | { ok: false; error: Error }
 * >}
 */
export async function completeBookingWithReviewInvite({
  accessToken,
  bookingId,
  businessId = null,
  booking,
  eligibilityCtx,
}) {
  const shouldSendInvite = willSendReviewInviteOnComplete(booking, eligibilityCtx);

  const { data, error } = await markBookingCompletedById(bookingId, businessId);
  if (error) {
    return {
      ok: false,
      error: new Error(error.message ?? 'Could not mark booking as completed'),
    };
  }

  const completedId = data?.id ?? bookingId;

  if (!shouldSendInvite) {
    return {
      ok: true,
      data: {
        id: completedId,
        status: data?.status ?? 'completed',
        reviewInviteSent: false,
      },
    };
  }

  const inviteResult = await postReviewInviteForBooking(accessToken, bookingId);
  if (!inviteResult.ok) {
    console.warn(
      '[review-invite] API failed after complete',
      inviteResult.httpStatus,
      inviteResult.error?.message,
      inviteResult.requestId ? { requestId: inviteResult.requestId } : undefined,
    );
    return {
      ok: true,
      data: {
        id: completedId,
        status: data?.status ?? 'completed',
        reviewInviteSent: false,
      },
    };
  }

  return {
    ok: true,
    data: {
      id: completedId,
      status: data?.status ?? 'completed',
      reviewInviteSent: inviteResult.data.sent === true,
    },
  };
}

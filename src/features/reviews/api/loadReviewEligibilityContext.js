import { supabase } from '../../../lib/supabase';

/**
 * @typedef {import('../utils/reviewInviteEligibility').BookingForReviewEligibility} BookingForReviewEligibility
 * @typedef {import('../utils/reviewInviteEligibility').ReviewEligibilityContext} ReviewEligibilityContext
 */

/**
 * Loads review-invite eligibility sets from Supabase (owner RLS session).
 * Mirrors web `loadReviewInviteEligibilityContext`.
 *
 * @param {string} businessId
 * @param {BookingForReviewEligibility[]} bookings
 * @returns {Promise<{ data: ReviewEligibilityContext | null; error: Error | null }>}
 */
export async function loadReviewEligibilityContext(businessId, bookings) {
  const customerIds = [
    ...new Set(bookings.map((b) => b.customer_id?.trim()).filter((id) => Boolean(id))),
  ];
  const bookingIds = bookings.map((b) => b.id).filter(Boolean);

  const reviewedCustomerIds = new Set();
  const pendingInviteCustomerIds = new Set();
  const bookingIdsWithInvite = new Set();

  if (customerIds.length > 0) {
    const { data: reviewRows, error: reviewError } = await supabase
      .from('reviews')
      .select('customer_id')
      .eq('business_id', businessId)
      .in('customer_id', customerIds);

    if (reviewError) {
      return { data: null, error: reviewError };
    }

    for (const row of reviewRows ?? []) {
      if (row.customer_id) {
        reviewedCustomerIds.add(row.customer_id);
      }
    }

    const { data: pendingRows, error: pendingError } = await supabase
      .from('review_invites')
      .select('customer_id')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .in('customer_id', customerIds);

    if (pendingError) {
      return { data: null, error: pendingError };
    }

    for (const row of pendingRows ?? []) {
      if (row.customer_id) {
        pendingInviteCustomerIds.add(row.customer_id);
      }
    }
  }

  if (bookingIds.length > 0) {
    const { data: inviteRows, error: inviteError } = await supabase
      .from('review_invites')
      .select('booking_id')
      .in('booking_id', bookingIds);

    if (inviteError) {
      return { data: null, error: inviteError };
    }

    for (const row of inviteRows ?? []) {
      if (row.booking_id) {
        bookingIdsWithInvite.add(row.booking_id);
      }
    }
  }

  return {
    data: { reviewedCustomerIds, pendingInviteCustomerIds, bookingIdsWithInvite },
    error: null,
  };
}

import { supabase } from '../../../lib/supabase';

/**
 * Whether this booking is the visit for a customer membership
 * (`period_visit_booking_id` or `initial_booking_id`).
 *
 * @param {{ businessId?: string | null; bookingId?: string | null }} args
 * @returns {Promise<{ linked: boolean; membershipId: string | null; error: Error | null }>}
 */
export async function fetchMembershipVisitForBooking({ businessId, bookingId }) {
  const bid = String(businessId ?? '').trim();
  const id = String(bookingId ?? '').trim();
  if (!bid || !id) {
    return { linked: false, membershipId: null, error: null };
  }

  const { data, error } = await supabase
    .from('customer_memberships')
    .select('id')
    .eq('business_id', bid)
    .or(`period_visit_booking_id.eq.${id},initial_booking_id.eq.${id}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { linked: false, membershipId: null, error };
  }

  const membershipId = data?.id != null ? String(data.id) : null;
  return { linked: Boolean(membershipId), membershipId, error: null };
}

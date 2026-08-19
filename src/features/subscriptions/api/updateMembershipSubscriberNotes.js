import { supabase } from '../../../lib/supabase';

export const MEMBERSHIP_NOTES_MAX_LEN = 2000;

/**
 * Owner notes on a subscriber (`customer_memberships.notes`).
 * Scoped to the owner business — not Stripe, not customer-visible templates.
 *
 * @param {string | null | undefined} businessId
 * @param {string | null | undefined} subscriberId `customer_memberships.id`
 * @param {string | null | undefined} notes
 * @returns {Promise<{ data: { id: string; notes: string | null } | null; error: Error | null }>}
 */
export async function updateMembershipSubscriberNotes(businessId, subscriberId, notes) {
  const bid = String(businessId ?? '').trim();
  const id = String(subscriberId ?? '').trim();
  if (!bid) {
    return { data: null, error: new Error('Missing business') };
  }
  if (!id) {
    return { data: null, error: new Error('Missing subscriber') };
  }

  const trimmed = String(notes ?? '')
    .trim()
    .slice(0, MEMBERSHIP_NOTES_MAX_LEN);
  const value = trimmed || null;

  const { data, error } = await supabase
    .from('customer_memberships')
    .update({ notes: value })
    .eq('business_id', bid)
    .eq('id', id)
    .select('id, notes')
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message || 'Could not save notes.') };
  }
  if (!data?.id) {
    return { data: null, error: new Error('Could not save notes.') };
  }
  return { data, error: null };
}

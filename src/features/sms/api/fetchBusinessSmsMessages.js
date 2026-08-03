import { supabase } from '../../../lib/supabase';

const SMS_HISTORY_SELECT =
  'id, type, body, status, to_phone, sent_at, created_at, booking_id, error';

/** Newest-first page size for Messages sent timeline. */
export const SMS_MESSAGES_PAGE_SIZE = 25;

/**
 * One page of outbound customer SMS history for a business (newest first).
 *
 * @param {string} businessId
 * @param {{ offset?: number; limit?: number }} [options]
 * @returns {Promise<{ data: object[] | null; error: Error | null }>}
 */
export async function fetchBusinessSmsMessages(businessId, options = {}) {
  const id = typeof businessId === 'string' ? businessId.trim() : '';
  if (!id) {
    return { data: [], error: null };
  }

  const offset = Math.max(0, Number(options.offset) || 0);
  const limit = Math.max(1, Number(options.limit) || SMS_MESSAGES_PAGE_SIZE);
  const from = offset;
  const to = offset + limit - 1;

  const { data, error } = await supabase
    .from('sms_messages')
    .select(SMS_HISTORY_SELECT)
    .eq('business_id', id)
    .eq('direction', 'outbound')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { data: null, error: new Error(error.message ?? 'Could not load sent messages') };
  }

  return { data: data ?? [], error: null };
}

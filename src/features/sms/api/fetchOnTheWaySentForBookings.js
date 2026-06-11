import { supabase } from '../../../lib/supabase';
import {
  SMS_MESSAGE_TYPE_ON_THE_WAY,
  SMS_ON_THE_WAY_SUCCESS_STATUSES,
} from '../constants/smsMessageTypes';

/**
 * Whether an `on_the_way` SMS was logged for each booking (messages-sent history; button state uses `job_status`).
 *
 * @param {string[]} bookingIds
 * @returns {Promise<Map<string, boolean>>}
 */
export async function fetchOnTheWaySentForBookings(bookingIds) {
  const ids = [...new Set((bookingIds ?? []).map((id) => id?.trim()).filter(Boolean))];
  const result = new Map(ids.map((id) => [id, false]));
  if (ids.length === 0) {
    return result;
  }

  const { data, error } = await supabase
    .from('sms_messages')
    .select('booking_id')
    .in('booking_id', ids)
    .eq('type', SMS_MESSAGE_TYPE_ON_THE_WAY)
    .in('status', SMS_ON_THE_WAY_SUCCESS_STATUSES);

  if (error) {
    throw new Error(error.message ?? 'Could not load SMS send state');
  }

  for (const row of data ?? []) {
    const bookingId = row?.booking_id;
    if (typeof bookingId === 'string' && bookingId.trim()) {
      result.set(bookingId.trim(), true);
    }
  }

  return result;
}

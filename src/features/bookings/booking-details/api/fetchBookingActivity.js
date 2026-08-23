import { supabase } from '../../../../lib/supabase';

const SMS_ACTIVITY_SELECT = 'id, type, status, sent_at, created_at';
const REVIEW_INVITE_SELECT = 'id, email_sent_at, sms_sent_at, created_at';
const BOOKING_ACTIVITY_SELECT = 'id, status, customer_email';

/**
 * Activity sources for one booking. Loaded only when the Activity screen opens.
 *
 * @param {string} bookingId
 * @returns {Promise<{
 *   data: {
 *     bookingStatus: string | null;
 *     customerEmail: string | null;
 *     smsRows: object[];
 *     reviewInvite: object | null;
 *   } | null;
 *   error: Error | null;
 * }>}
 */
export async function fetchBookingActivity(bookingId) {
  const id = typeof bookingId === 'string' ? bookingId.trim() : '';
  if (!id) {
    return { data: null, error: new Error('Missing booking') };
  }

  const [bookingResult, smsResult, inviteResult] = await Promise.all([
    supabase.from('bookings').select(BOOKING_ACTIVITY_SELECT).eq('id', id).maybeSingle(),
    supabase
      .from('sms_messages')
      .select(SMS_ACTIVITY_SELECT)
      .eq('booking_id', id)
      .eq('direction', 'outbound')
      .order('created_at', { ascending: false }),
    supabase
      .from('review_invites')
      .select(REVIEW_INVITE_SELECT)
      .eq('booking_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (bookingResult.error) {
    return {
      data: null,
      error: new Error(bookingResult.error.message ?? 'Could not load booking'),
    };
  }
  if (smsResult.error) {
    return {
      data: null,
      error: new Error(smsResult.error.message ?? 'Could not load texts'),
    };
  }
  if (inviteResult.error && inviteResult.error.code !== 'PGRST116') {
    return {
      data: null,
      error: new Error(inviteResult.error.message ?? 'Could not load review link'),
    };
  }

  return {
    data: {
      bookingStatus: bookingResult.data?.status ?? null,
      customerEmail:
        typeof bookingResult.data?.customer_email === 'string'
          ? bookingResult.data.customer_email
          : null,
      smsRows: smsResult.data ?? [],
      reviewInvite: inviteResult.data ?? null,
    },
    error: null,
  };
}

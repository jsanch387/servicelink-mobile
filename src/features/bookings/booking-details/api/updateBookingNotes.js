import { updateBookingById } from '../../edit-appointment/api/updateBookingById';

/** Same cap as the appointment notes field. */
export const BOOKING_NOTES_MAX_LENGTH = 280;

/**
 * Saves visit notes on the booking row. Empty text clears the notes.
 *
 * @param {string} bookingId
 * @param {string} notes
 * @param {string | null | undefined} [businessId]
 * @returns {Promise<{ ok: true, bookingId: string, notes: string } | { ok: false, error: Error | import('@supabase/supabase-js').PostgrestError }>}
 */
export async function updateBookingNotes(bookingId, notes, businessId) {
  const id = String(bookingId ?? '').trim();
  if (!id) {
    return { ok: false, error: new Error('Missing booking.') };
  }

  const trimmed = String(notes ?? '')
    .trim()
    .slice(0, BOOKING_NOTES_MAX_LENGTH);
  const { data, error } = await updateBookingById(id, { customer_notes: trimmed }, businessId);
  if (error || !data?.id) {
    return { ok: false, error: error ?? new Error('Could not save notes.') };
  }

  return { ok: true, bookingId: data.id, notes: trimmed };
}

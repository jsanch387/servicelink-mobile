import { supabase } from '../../../../lib/supabase';
import { normalizeEmailForDedupe } from '../../../../utils/email';
import { normalizePhoneForDatabase } from '../../../../utils/phone';
import { updateBookingById } from '../../edit-appointment/api/updateBookingById';

const PG_UNIQUE_VIOLATION = '23505';

/**
 * @param {import('@supabase/supabase-js').PostgrestError | null | undefined} error
 */
function isUniqueViolation(error) {
  if (!error) {
    return false;
  }
  const code = /** @type {{ code?: string }} */ (error).code;
  const msg = String(error.message ?? '');
  return (
    code === PG_UNIQUE_VIOLATION ||
    msg.includes('duplicate key') ||
    msg.includes('unique constraint')
  );
}

/**
 * @param {{
 *   businessId: string;
 *   customerId: string;
 *   email?: string | null;
 *   phoneDigits?: string | null;
 * }} args
 */
async function syncLinkedCustomerContactBestEffort({ businessId, customerId, email, phoneDigits }) {
  /** @type {Record<string, string>} */
  const patch = {};
  if (email) {
    const emailNormalized = normalizeEmailForDedupe(email);
    if (emailNormalized) {
      const { data: existingOwner, error: lookupError } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', businessId)
        .eq('email_normalized', emailNormalized)
        .neq('id', customerId)
        .maybeSingle();
      if (!lookupError && !existingOwner?.id) {
        patch.email = email;
        patch.email_normalized = emailNormalized;
      }
    }
  }
  if (phoneDigits) {
    const { data: existingOwner, error: lookupError } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', businessId)
      .eq('phone_normalized', phoneDigits)
      .neq('id', customerId)
      .maybeSingle();
    if (!lookupError && !existingOwner?.id) {
      patch.phone = phoneDigits;
      patch.phone_normalized = phoneDigits;
    }
  }

  if (Object.keys(patch).length === 0) {
    return;
  }

  const { error: customerError } = await supabase
    .from('customers')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', customerId)
    .select('id')
    .maybeSingle();

  if (customerError && !isUniqueViolation(customerError)) {
    return;
  }
}

/**
 * Persists receipt contact on the booking snapshot and, when safe, the linked CRM customer.
 *
 * @param {string} bookingId
 * @param {{ email?: string | null; phone?: string | null }} contact
 * @param {{
 *   businessId?: string | null;
 *   customerId?: string | null;
 * }} [options]
 */
export async function updateBookingCustomerContact(bookingId, contact = {}, options = {}) {
  const email = String(contact.email ?? '').trim();
  const phoneDigits = normalizePhoneForDatabase(contact.phone) ?? '';
  const businessId = options.businessId?.trim() || undefined;
  const customerId = options.customerId?.trim() || undefined;

  /** @type {Record<string, string>} */
  const bookingPatch = {};
  if (email) {
    bookingPatch.customer_email = email;
  }
  if (phoneDigits) {
    bookingPatch.customer_phone = phoneDigits;
  }

  if (Object.keys(bookingPatch).length === 0) {
    return { data: null, error: new Error('missing_contact') };
  }

  const { data, error } = await updateBookingById(bookingId, bookingPatch, businessId);
  if (error) {
    return { data, error };
  }

  if (customerId && businessId) {
    await syncLinkedCustomerContactBestEffort({
      businessId,
      customerId,
      email: email || null,
      phoneDigits: phoneDigits || null,
    });
  }

  return {
    data,
    error: null,
    email: email || null,
    phone: phoneDigits || null,
  };
}

/**
 * Persists receipt email on the booking snapshot and, when safe, the linked CRM customer row.
 *
 * @param {string} bookingId
 * @param {string} email
 * @param {{
 *   businessId?: string | null;
 *   customerId?: string | null;
 * }} [options]
 * @deprecated Prefer {@link updateBookingCustomerContact}.
 */
export async function updateBookingCustomerEmail(bookingId, email, options = {}) {
  return updateBookingCustomerContact(bookingId, { email }, options);
}

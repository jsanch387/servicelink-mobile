import { supabase } from '../../../../lib/supabase';
import { normalizeEmailForDedupe } from '../../../../utils/email';
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
 * Best-effort CRM sync — never blocks receipt email on the booking snapshot.
 *
 * @param {{
 *   businessId: string;
 *   customerId: string;
 *   email: string;
 *   emailNormalized: string;
 * }} args
 */
async function syncLinkedCustomerEmailBestEffort({
  businessId,
  customerId,
  email,
  emailNormalized,
}) {
  const { data: existingOwner, error: lookupError } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', businessId)
    .eq('email_normalized', emailNormalized)
    .neq('id', customerId)
    .maybeSingle();

  if (lookupError) {
    return;
  }
  if (existingOwner?.id) {
    return;
  }

  const { error: customerError } = await supabase
    .from('customers')
    .update({ email, email_normalized: emailNormalized })
    .eq('business_id', businessId)
    .eq('id', customerId)
    .select('id')
    .maybeSingle();

  if (customerError && !isUniqueViolation(customerError)) {
    return;
  }
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
 */
export async function updateBookingCustomerEmail(bookingId, email, options = {}) {
  const trimmed = String(email ?? '').trim();
  const businessId = options.businessId?.trim() || undefined;
  const customerId = options.customerId?.trim() || undefined;

  const { data, error } = await updateBookingById(
    bookingId,
    { customer_email: trimmed },
    businessId,
  );
  if (error) {
    return { data, error };
  }

  if (customerId && businessId) {
    const emailNormalized = normalizeEmailForDedupe(trimmed);
    if (emailNormalized) {
      await syncLinkedCustomerEmailBestEffort({
        businessId,
        customerId,
        email: trimmed,
        emailNormalized,
      });
    }
  }

  return { data, error: null };
}

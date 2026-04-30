import { supabase } from '../../../../lib/supabase';
import { normalizePhoneForDatabase } from '../../../../utils/phone';

const PG_UNIQUE_VIOLATION = '23505';

/**
 * Lowercase trimmed email for dedupe (matches web `email_normalized` lookups).
 * @param {string | null | undefined} email
 * @returns {string | null}
 */
export function normalizeEmailForDedupe(email) {
  const t = String(email ?? '')
    .trim()
    .toLowerCase();
  return t || null;
}

/**
 * @param {import('@supabase/supabase-js').PostgrestError | Error | null | undefined} error
 */
function isUniqueViolation(error) {
  if (!error) return false;
  if (error.code === PG_UNIQUE_VIOLATION) return true;
  const msg = String(error.message ?? '');
  return msg.includes('duplicate key') || msg.includes('unique constraint');
}

/**
 * @param {string} businessId
 * @param {string} phone_normalized
 */
async function findCustomerIdByPhone(businessId, phone_normalized) {
  const { data } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', businessId)
    .eq('phone_normalized', phone_normalized)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * @param {string} businessId
 * @param {string} email_normalized
 */
async function findCustomerIdByEmail(businessId, email_normalized) {
  const { data } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', businessId)
    .eq('email_normalized', email_normalized)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Resolves or creates a CRM row for this business before inserting a booking (web parity).
 * Order: match `phone_normalized` → else `email_normalized` → else insert; on unique conflict, re-fetch.
 *
 * @param {string} businessId
 * @param {{ fullName: string; email: string; phone: string }} input `phone` may be formatted or 10-digit storage form.
 * @returns {Promise<{ data: { id: string } | null; error: Error | null }>}
 */
export async function upsertCustomerForBooking(businessId, { fullName, email, phone }) {
  const phone_normalized = normalizePhoneForDatabase(phone) ?? '';
  const email_normalized = normalizeEmailForDedupe(email);

  if (phone_normalized) {
    const byPhone = await findCustomerIdByPhone(businessId, phone_normalized);
    if (byPhone) return { data: { id: byPhone }, error: null };
  }

  if (email_normalized) {
    const byEmail = await findCustomerIdByEmail(businessId, email_normalized);
    if (byEmail) return { data: { id: byEmail }, error: null };
  }

  const insertRow = {
    business_id: businessId,
    full_name: String(fullName ?? '').trim() || null,
    email: String(email ?? '').trim() || null,
    phone: phone_normalized || null,
    phone_normalized: phone_normalized || null,
    email_normalized: email_normalized,
  };

  const { data: inserted, error } = await supabase
    .from('customers')
    .insert(insertRow)
    .select('id')
    .maybeSingle();

  if (!error && inserted?.id) {
    return { data: { id: inserted.id }, error: null };
  }

  if (isUniqueViolation(error)) {
    if (phone_normalized) {
      const id = await findCustomerIdByPhone(businessId, phone_normalized);
      if (id) return { data: { id }, error: null };
    }
    if (email_normalized) {
      const id = await findCustomerIdByEmail(businessId, email_normalized);
      if (id) return { data: { id }, error: null };
    }
  }

  return { data: null, error: error ?? new Error('Could not save customer') };
}

import { Platform } from 'react-native';
import { supabase } from '../../../lib/supabase';
import {
  NO_EXISTING_SERVICELINK_ACCOUNT_CODE,
  NO_EXISTING_SERVICELINK_ACCOUNT_MESSAGE,
} from '../constants/existingAccountOnlyCopy';

/**
 * @param {import('@supabase/supabase-js').User} user
 * @returns {string | null}
 */
export function pickFullNameFromUserMetadata(user) {
  const meta = user?.user_metadata ?? {};
  const fromFull = meta.full_name ?? meta.name;
  if (typeof fromFull === 'string' && fromFull.trim()) {
    return fromFull.trim();
  }
  return null;
}

export function createNoExistingServiceLinkAccountError() {
  const error = new Error(NO_EXISTING_SERVICELINK_ACCOUNT_MESSAGE);
  error.code = NO_EXISTING_SERVICELINK_ACCOUNT_CODE;
  return error;
}

/**
 * Mobile login-only: require an existing `profiles` row (no auto-provision).
 *
 * @param {import('@supabase/supabase-js').Session} session
 * @returns {Promise<{ ok: true } | { ok: false; error: Error }>}
 */
async function assertExistingServiceLinkAccount(session) {
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: new Error('Missing user id') };
  }

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: new Error(readError.message ?? 'Could not read profile') };
  }
  if (!existing?.user_id) {
    return { ok: false, error: createNoExistingServiceLinkAccountError() };
  }
  return { ok: true };
}

/**
 * Ensures a `profiles` row exists for the signed-in user.
 * On native, login-only: never inserts profiles.
 *
 * @param {import('@supabase/supabase-js').Session} session
 * @returns {Promise<{ ok: true } | { ok: false; error: Error }>}
 */
export async function ensureUserProfileRow(session) {
  if (Platform.OS !== 'web') {
    return assertExistingServiceLinkAccount(session);
  }

  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: new Error('Missing user id') };
  }

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: new Error(readError.message ?? 'Could not read profile') };
  }
  if (existing?.user_id) {
    return { ok: true };
  }

  const fullName = pickFullNameFromUserMetadata(session.user);

  const { error: insertError } = await supabase.from('profiles').insert({
    user_id: userId,
    full_name: fullName,
  });

  if (insertError) {
    const code = insertError.code ?? '';
    if (code === '23505') {
      return { ok: true };
    }
    return { ok: false, error: new Error(insertError.message ?? 'Could not create profile') };
  }

  return { ok: true };
}

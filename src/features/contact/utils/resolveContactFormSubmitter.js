import { pickFullNameFromUserMetadata } from '../../auth/api/ensureUserProfile';
import { isValidEmailFormat } from '../../../utils/email';
import { CONTACT_NAME_MAX } from './validateContactForm';

/**
 * Build server `name` / `email` from the signed-in user (not shown in the form).
 *
 * @param {import('@supabase/supabase-js').User | null | undefined} user
 * @returns {{ ok: true; name: string; email: string } | { ok: false; error: string }}
 */
export function resolveContactFormSubmitter(user) {
  const email = typeof user?.email === 'string' ? user.email.trim() : '';
  if (!email || !isValidEmailFormat(email)) {
    return {
      ok: false,
      error: 'Your account email is missing. Try signing out and back in.',
    };
  }

  let name = pickFullNameFromUserMetadata(user);
  if (!name) {
    const localPart = email.split('@')[0]?.trim();
    name = localPart || 'ServiceLink user';
  }
  if (name.length > CONTACT_NAME_MAX) {
    name = name.slice(0, CONTACT_NAME_MAX);
  }

  return { ok: true, name, email };
}

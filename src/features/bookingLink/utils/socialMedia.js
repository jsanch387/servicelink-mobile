/** Platforms we edit on the booking-link Contact tab. */
export const BOOKING_LINK_SOCIAL_PLATFORMS = Object.freeze(['instagram', 'tiktok']);

/**
 * Strip leading @ and whitespace — DB stores bare handles.
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeSocialHandle(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/^@+/, '');
}

/**
 * @param {unknown} raw `business_profiles.social_media` jsonb
 * @returns {{ instagram: string; tiktok: string }}
 */
export function socialMediaFromDb(raw) {
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    instagram: normalizeSocialHandle(obj.instagram),
    tiktok: normalizeSocialHandle(obj.tiktok),
  };
}

/**
 * Persist only non-empty handles (omit keys when blank).
 * @param {{ instagram?: string; tiktok?: string } | null | undefined} handles
 * @returns {Record<string, string>}
 */
export function socialMediaToDb(handles) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const key of BOOKING_LINK_SOCIAL_PLATFORMS) {
    const handle = normalizeSocialHandle(handles?.[key]);
    if (handle) {
      out[key] = handle;
    }
  }
  return out;
}

/**
 * Public profile URL for a stored handle (DB has no `@`).
 * @param {'instagram' | 'tiktok'} platform
 * @param {string | null | undefined} handle
 * @returns {string | null}
 */
export function socialMediaPublicUrl(platform, handle) {
  const h = normalizeSocialHandle(handle);
  if (!h) return null;
  if (platform === 'instagram') {
    return `https://instagram.com/${encodeURIComponent(h)}`;
  }
  if (platform === 'tiktok') {
    return `https://www.tiktok.com/@${encodeURIComponent(h)}`;
  }
  return null;
}

/**
 * Stable dirty-check key for social handles.
 * @param {{ instagram?: string; tiktok?: string } | null | undefined} handles
 * @returns {string}
 */
export function socialMediaFingerprint(handles) {
  const n = socialMediaFromDb(handles);
  return `instagram:${n.instagram}\u0001tiktok:${n.tiktok}`;
}

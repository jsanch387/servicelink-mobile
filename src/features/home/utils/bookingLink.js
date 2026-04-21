/** Public booking pages live on this host (no scheme in display URLs). */
export const BOOKING_LINK_HOST = 'myservicelink.app';

export function normalizeBusinessSlug(slug) {
  if (slug == null) {
    return '';
  }
  return String(slug).trim().replace(/^\/+|\/+$/g, '');
}

/** e.g. `myservicelink.app/your-slug` — empty slug returns empty string. */
export function getBookingLinkDisplay(slug) {
  const s = normalizeBusinessSlug(slug);
  if (!s) {
    return '';
  }
  return `${BOOKING_LINK_HOST}/${s}`;
}

/** Full URL written to the clipboard when sharing. Empty slug returns empty string. */
export function getBookingLinkHttpsUrl(slug) {
  const s = normalizeBusinessSlug(slug);
  if (!s) {
    return '';
  }
  return `https://${BOOKING_LINK_HOST}/${s}`;
}

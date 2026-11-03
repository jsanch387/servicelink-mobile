const STORAGE_OBJECT_PUBLIC = '/storage/v1/object/public/';
const STORAGE_RENDER_PUBLIC = '/storage/v1/render/image/public/';

/** Wide enough for a phone cover at 3x, small enough for the image view to decode. */
const COVER_RENDER_WIDTH = 1080;
const COVER_RENDER_QUALITY = 70;

/**
 * Resized public URL for a booking-link cover. Original uploads are often
 * full camera size, which the native image view fails to draw.
 *
 * @param {string | null | undefined} src
 * @returns {string | null}
 */
export function getCoverDisplayUrl(src) {
  const value = String(src ?? '').trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!url.pathname.includes(STORAGE_OBJECT_PUBLIC)) return value;
    const version = url.searchParams.get('v');
    url.pathname = url.pathname.replace(STORAGE_OBJECT_PUBLIC, STORAGE_RENDER_PUBLIC);
    url.search = '';
    url.searchParams.set('width', String(COVER_RENDER_WIDTH));
    url.searchParams.set('quality', String(COVER_RENDER_QUALITY));
    if (version) url.searchParams.set('v', version);
    return url.toString();
  } catch {
    return value;
  }
}

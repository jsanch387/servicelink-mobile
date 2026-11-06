import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import { MAX_BUSINESS_SLUG_LEN } from '../../more/utils/businessSlug';

const MIN_SLUG_LENGTH = 3;

function compactSlug(raw) {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, MAX_BUSINESS_SLUG_LEN);
}

function withSuffix(base, n) {
  const suffix = String(n);
  return `${base.slice(0, MAX_BUSINESS_SLUG_LEN - suffix.length)}${suffix}`;
}

/**
 * GET `/api/business-profile/slug/check`
 * @param {string} slug
 * @returns {Promise<boolean | null>} true free, false taken, null when the check could not run
 */
async function isSlugFree(slug) {
  const origin = resolveStripeMobileCheckoutOrigin();
  if (!origin) return null;
  try {
    const response = await fetch(
      `${origin.replace(/\/$/, '')}/api/business-profile/slug/check?slug=${encodeURIComponent(slug)}`,
    );
    if (response.ok) return true;
    if (response.status === 409 || response.status === 400) return false;
    return null;
  } catch {
    return null;
  }
}

/**
 * @param {string} raw
 * @returns {Promise<
 *   | { status: 'idle'; slug: string }
 *   | { status: 'free'; slug: string }
 *   | { status: 'taken'; slug: string; suggestion: string }
 *   | { status: 'error'; slug: string }
 * >}
 */
export async function resolveBookingSlugAvailability(raw) {
  const slug = compactSlug(raw);
  if (slug.length < MIN_SLUG_LENGTH) {
    return { status: 'idle', slug };
  }

  const available = await isSlugFree(slug);
  if (available === null) return { status: 'error', slug };
  if (available) return { status: 'free', slug };

  for (let n = 2; n < 20; n += 1) {
    const suggestion = withSuffix(slug, n);
    const next = await isSlugFree(suggestion);
    if (next === true) return { status: 'taken', slug, suggestion };
    if (next === null) return { status: 'error', slug };
  }

  return { status: 'taken', slug, suggestion: withSuffix(slug, 2) };
}

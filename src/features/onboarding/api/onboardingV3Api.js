import { getSession } from '../../auth/api/auth';
import {
  assertStripeCheckoutOriginAllowed,
  resolveStripeMobileCheckoutOrigin,
} from '../../../lib/stripeMobileCheckoutOrigin';

const PUBLIC_BOOKING_ORIGIN = 'https://myservicelink.app';

/**
 * Public booking page with the website coach turned on.
 * The site reads `practice=1`, starts the coach, then removes the parameter.
 *
 * @param {string} slug
 */
export function practiceBookingUrl(slug) {
  const origin = resolveStripeMobileCheckoutOrigin() || PUBLIC_BOOKING_ORIGIN;
  return `${origin.replace(/\/$/, '')}/${slug}?practice=1`;
}

/**
 * @param {string} raw
 */
export function phoneDigitsForOnboarding(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * @param {string} path
 * @param {Record<string, unknown>} body
 */
async function postOnboarding(path, body) {
  const origin = resolveStripeMobileCheckoutOrigin();
  if (!origin) {
    return { ok: false, message: 'The setup server is not configured.' };
  }
  try {
    assertStripeCheckoutOriginAllowed(origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid server.';
    return { ok: false, message };
  }

  const { data } = await getSession();
  const accessToken = data?.session?.access_token;
  if (!accessToken) {
    return { ok: false, message: 'Please sign in again to continue.' };
  }

  let response;
  try {
    response = await fetch(`${origin}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, message: "Couldn't reach the server. Try again." };
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok || payload?.success === false) {
    const message =
      typeof payload?.error === 'string' && payload.error.trim()
        ? payload.error.trim()
        : "Couldn't save that. Try again.";
    return { ok: false, message };
  }

  return { ok: true, payload };
}

/**
 * POST `/api/onboarding-v3/step1`
 *
 * @param {{ industry: string, trades: string[] }} input
 */
export async function saveOnboardingIndustry({ industry, trades }) {
  const result = await postOnboarding('/api/onboarding-v3/step1', { industry, trades });
  if (!result.ok) return result;
  return { ok: true, businessProfileId: result.payload.businessProfileId };
}

/**
 * POST `/api/onboarding-v3/finish`
 * The server claims the link, adds sample services, sets weekday hours, and sends the you're-live email.
 *
 * @param {{
 *   businessName: string,
 *   slug: string,
 *   phone: string,
 *   industry: string,
 *   trades: string[],
 * }} input
 */
export async function finishOnboardingSetup({ businessName, slug, phone, industry, trades }) {
  const digits = phoneDigitsForOnboarding(phone);
  if (digits.length !== 0 && digits.length !== 10) {
    return { ok: false, message: 'Enter a 10-digit phone number, or leave it blank.' };
  }

  const result = await postOnboarding('/api/onboarding-v3/finish', {
    businessName,
    slug,
    phone: digits,
    industry,
    trades,
  });
  if (!result.ok) return result;

  const savedSlug =
    typeof result.payload.slug === 'string' && result.payload.slug.trim()
      ? result.payload.slug.trim()
      : slug;
  return { ok: true, slug: savedSlug, businessProfileId: result.payload.businessProfileId };
}

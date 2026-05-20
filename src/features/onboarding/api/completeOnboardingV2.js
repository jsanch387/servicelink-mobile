import {
  assertStripeCheckoutOriginAllowed,
  resolveStripeMobileCheckoutOrigin,
} from '../../../lib/stripeMobileCheckoutOrigin';
import {
  onboardingCompleteLogError,
  onboardingCompleteLogOk,
} from '../utils/onboardingCompleteLog';
import { mapCompleteOnboardingHttpError } from '../utils/mapCompleteOnboardingHttpError';

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @param {unknown} value
 * @returns {Record<string, unknown> | null}
 */
function asWelcomeEmail(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? /** @type {Record<string, unknown>} */ (value)
    : null;
}

/**
 * @param {Record<string, unknown> | null} welcomeEmail
 */
function logWelcomeEmailOutcome(welcomeEmail) {
  if (!welcomeEmail) {
    return;
  }
  if (welcomeEmail.sent === true) {
    onboardingCompleteLogOk('welcome email sent');
    return;
  }
  if (welcomeEmail.attempted === false && welcomeEmail.reason) {
    onboardingCompleteLogOk(`welcome email skipped (${String(welcomeEmail.reason)})`);
    return;
  }
  if (welcomeEmail.attempted === true && welcomeEmail.sent === false) {
    const detail =
      typeof welcomeEmail.error === 'string' && welcomeEmail.error.trim()
        ? welcomeEmail.error.trim()
        : 'send failed';
    onboardingCompleteLogOk(`welcome email not sent (${detail})`);
  }
}

/**
 * POST `/api/onboarding-v2/complete` — server marks onboarding complete and sends welcome-live email.
 * Mobile onboarding step 5 — marks the user complete on the server (free tier; no in-app Stripe).
 *
 * @param {string | null | undefined} accessToken Supabase session access token (Bearer).
 * @param {{ sendWelcomeEvenIfAlreadyCompleted?: boolean }} [options]
 * @returns {Promise<
 *   | { ok: true }
 *   | { error: Error; httpStatus: number; userMessage: string }
 * >}
 */
export async function completeOnboardingV2(accessToken, options = {}) {
  const origin = resolveStripeMobileCheckoutOrigin();
  if (!origin) {
    const userMessage = mapCompleteOnboardingHttpError(0, null);
    onboardingCompleteLogError('missing web app URL');
    return { error: new Error('EXPO_PUBLIC_WEB_APP_URL is not set'), httpStatus: 0, userMessage };
  }
  if (!accessToken) {
    onboardingCompleteLogError('not signed in');
    return {
      error: new Error('Not signed in'),
      httpStatus: 0,
      userMessage: 'Please sign in again to continue.',
    };
  }
  try {
    assertStripeCheckoutOriginAllowed(origin);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Invalid web origin');
    const userMessage = mapCompleteOnboardingHttpError(0, err.message);
    onboardingCompleteLogError('invalid web origin', err.message);
    return { error: err, httpStatus: 0, userMessage };
  }

  const requestId = createRequestId();
  const body =
    options.sendWelcomeEvenIfAlreadyCompleted === true
      ? { sendWelcomeEvenIfAlreadyCompleted: true }
      : {};

  onboardingCompleteLogOk('complete request started');

  let res;
  try {
    res = await fetch(`${origin}/api/onboarding-v2/complete`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Network request failed');
    const userMessage = mapCompleteOnboardingHttpError(0, err.message);
    onboardingCompleteLogError('network error', err.message);
    return { error: err, httpStatus: 0, userMessage };
  }

  let payload = {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  const serverError =
    typeof payload?.error === 'string'
      ? payload.error
      : typeof payload?.message === 'string'
        ? payload.message
        : null;

  const failed = !res.ok || payload?.success === false;
  if (failed) {
    const userMessage = mapCompleteOnboardingHttpError(res.status, serverError);
    onboardingCompleteLogError(`complete failed (${res.status})`, serverError ?? userMessage);
    return {
      error: new Error(serverError || userMessage),
      httpStatus: res.status,
      userMessage,
    };
  }

  if (payload?.success === true) {
    logWelcomeEmailOutcome(asWelcomeEmail(payload.welcome_email));
    onboardingCompleteLogOk('complete succeeded');
    return { ok: true };
  }

  const userMessage = mapCompleteOnboardingHttpError(res.status, serverError);
  onboardingCompleteLogError('invalid response', serverError ?? userMessage);
  return {
    error: new Error(serverError || 'Invalid response'),
    httpStatus: res.status,
    userMessage,
  };
}

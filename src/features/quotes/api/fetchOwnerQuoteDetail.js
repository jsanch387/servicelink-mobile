import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';

/**
 * Loads the normalized owner quote detail contract from the web API.
 *
 * @param {string | null | undefined} accessToken
 * @param {string | null | undefined} quoteId
 * @returns {Promise<{ data: object | null; error: Error | null }>}
 */
export async function fetchOwnerQuoteDetail(accessToken, quoteId) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsError = productionWebApiHttpsGuard(origin);
  if (httpsError) return { data: null, error: httpsError };

  const token = String(accessToken ?? '').trim();
  const id = String(quoteId ?? '').trim();
  if (!token) return { data: null, error: new Error('Sign in to view this quote.') };
  if (!id) return { data: null, error: new Error('Missing quote id.') };

  let response;
  try {
    response = await fetch(`${origin}/api/quotes/${encodeURIComponent(id)}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Network request failed.'),
    };
  }

  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (response.ok && body?.success === true && body.quote && typeof body.quote === 'object') {
    return { data: body.quote, error: null };
  }

  const serverMessage =
    typeof body?.error === 'string'
      ? body.error.trim()
      : typeof body?.message === 'string'
        ? body.message.trim()
        : '';
  const fallback =
    response.status === 401
      ? 'Sign in to view this quote.'
      : response.status === 404
        ? 'This quote is no longer available.'
        : 'Could not load this quote.';
  return { data: null, error: new Error(serverMessage || fallback) };
}

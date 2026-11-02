import { GOOGLE_REVIEWS_AUTH_RETURN_URL } from '../constants/reviewsApiRoutes';

/**
 * @param {string | null | undefined} url
 * @returns {'connected' | 'error' | null}
 */
export function parseGoogleConnectReturn(url) {
  const value = String(url ?? '').trim();
  if (!value.startsWith(GOOGLE_REVIEWS_AUTH_RETURN_URL)) return null;

  try {
    const notice = new URL(value).searchParams.get('google');
    if (notice === 'connected' || notice === 'error') return notice;
  } catch {
    return null;
  }

  return null;
}

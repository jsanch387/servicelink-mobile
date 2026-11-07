/** Web API paths for reviews. Origin is `resolveStripeMobileCheckoutOrigin()`. */
export const API_ROUTES = Object.freeze({
  REVIEWS: '/api/reviews',
  REVIEWS_GOOGLE_CONNECT: '/api/reviews/google/connect',
  REVIEWS_GOOGLE_STATUS: '/api/reviews/google/status',
});

/** Matches the server page size for `GET /api/reviews`. */
export const REVIEWS_INBOX_PAGE_SIZE = 10;

/** Prefix `WebBrowser.openAuthSessionAsync` waits for. The bridge opens this scheme. */
export const GOOGLE_REVIEWS_AUTH_RETURN_URL = 'servicelinkmobile://reviews/google';

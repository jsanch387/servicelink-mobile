/**
 * Non-dev builds must call Next.js `/api/*` routes over TLS.
 * @param {string} origin
 * @returns {Error | null}
 */
export function productionWebApiHttpsGuard(origin) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return null;
  }
  try {
    const u = new URL(origin);
    if (u.protocol !== 'https:') {
      return new Error(
        'Production API requires HTTPS — set EXPO_PUBLIC_WEB_APP_URL to an https:// origin.',
      );
    }
  } catch {
    return new Error('Invalid EXPO_PUBLIC_WEB_APP_URL');
  }
  return null;
}

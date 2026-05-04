/**
 * Base URL for the Next.js app (same origin as `/api/*`). No trailing slash.
 * @see EXPO_PUBLIC_WEB_APP_URL in `.env`
 */
export function getWebAppOrigin() {
  const raw = process.env.EXPO_PUBLIC_WEB_APP_URL ?? '';
  return String(raw).trim().replace(/\/$/, '');
}

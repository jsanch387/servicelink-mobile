import { getWebAppOrigin } from '../../../lib/webAppOrigin';

const PROD_WEB_ORIGIN = 'https://myservicelink.app';

/**
 * Customer link for a sent bill: `{origin}/b/{shortCode}`.
 *
 * @param {string | null | undefined} shortCode
 */
export function invoicePublicUrl(shortCode) {
  const code = String(shortCode ?? '').trim();
  if (!code) return '';
  const origin = (getWebAppOrigin() || PROD_WEB_ORIGIN).replace(/\/$/, '');
  return `${origin}/b/${encodeURIComponent(code)}`;
}

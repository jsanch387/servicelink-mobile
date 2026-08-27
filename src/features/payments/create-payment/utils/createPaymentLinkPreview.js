import { getWebAppOrigin } from '../../../../lib/webAppOrigin';

const FALLBACK_ORIGIN = 'https://myservicelink.app';

/** Canonical pay-page path. Server will own the real tokenized URL. */
export const CREATE_PAYMENT_LINK_PATH = '/pay';

export function getCreatePaymentLinkOrigin() {
  return getWebAppOrigin() || FALLBACK_ORIGIN;
}

/**
 * Preview of the share URL until the server returns a real payment-link id.
 * @param {{ amount?: number | null; note?: string }} [input]
 */
export function buildCreatePaymentLinkPreviewUrl({ amount, note } = {}) {
  const origin = getCreatePaymentLinkOrigin().replace(/\/$/, '');
  const params = new URLSearchParams();
  if (amount != null && Number.isFinite(amount) && amount > 0) {
    params.set('amount', amount.toFixed(2));
  }
  const trimmedNote = String(note ?? '').trim();
  if (trimmedNote) {
    params.set('for', trimmedNote.slice(0, 80));
  }
  const query = params.toString();
  return query
    ? `${origin}${CREATE_PAYMENT_LINK_PATH}?${query}`
    : `${origin}${CREATE_PAYMENT_LINK_PATH}`;
}

/** Host line for the iMessage-style preview (no scheme). */
export function formatCreatePaymentLinkHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return 'myservicelink.app';
  }
}

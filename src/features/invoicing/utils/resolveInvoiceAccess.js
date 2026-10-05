import { INVOICE_EARLY_ACCESS_EMAILS } from '../constants/invoiceFeatureFlags';

/**
 * @param {string | null | undefined} email
 * @returns {boolean}
 */
export function isInvoiceEarlyAccessEmail(email) {
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  return INVOICE_EARLY_ACCESS_EMAILS.some((entry) => entry.trim().toLowerCase() === normalized);
}

/**
 * Whether this login can see More → Invoices and the invoice screens.
 * A non-empty allowlist hides the feature from every other account, including Pro.
 *
 * @param {{
 *   email?: string | null;
 *   canSeeOffice?: boolean;
 *   hasProAccess?: boolean;
 *   profileLoaded?: boolean;
 *   restrictToEarlyAccess?: boolean;
 * }} [params]
 * @returns {{ canSeeInvoices: boolean; isReady: boolean }}
 */
export function resolveInvoiceAccess({
  email = null,
  canSeeOffice = false,
  hasProAccess = false,
  profileLoaded = false,
  restrictToEarlyAccess = INVOICE_EARLY_ACCESS_EMAILS.length > 0,
} = {}) {
  if (restrictToEarlyAccess && !isInvoiceEarlyAccessEmail(email)) {
    return { canSeeInvoices: false, isReady: true };
  }
  if (!profileLoaded) {
    return { canSeeInvoices: false, isReady: false };
  }
  return {
    canSeeInvoices: Boolean(canSeeOffice && hasProAccess),
    isReady: true,
  };
}

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
 * Whether this login can open More → Invoices.
 * Pro owners use the list. Other office owners see the subscribe card.
 * A non-empty allowlist hides the feature from every other account.
 *
 * @param {{
 *   email?: string | null;
 *   canSeeOffice?: boolean;
 *   hasProAccess?: boolean;
 *   profileLoaded?: boolean;
 *   restrictToEarlyAccess?: boolean;
 * }} [params]
 * @returns {{
 *   canSeeInvoices: boolean;
 *   canUseInvoices: boolean;
 *   showUpsell: boolean;
 *   isReady: boolean;
 * }}
 */
export function resolveInvoiceAccess({
  email = null,
  canSeeOffice = false,
  hasProAccess = false,
  profileLoaded = false,
  restrictToEarlyAccess = INVOICE_EARLY_ACCESS_EMAILS.length > 0,
} = {}) {
  if (restrictToEarlyAccess && !isInvoiceEarlyAccessEmail(email)) {
    return { canSeeInvoices: false, canUseInvoices: false, showUpsell: false, isReady: true };
  }
  if (!profileLoaded) {
    return { canSeeInvoices: false, canUseInvoices: false, showUpsell: false, isReady: false };
  }
  if (!canSeeOffice) {
    return { canSeeInvoices: false, canUseInvoices: false, showUpsell: false, isReady: true };
  }
  if (hasProAccess) {
    return { canSeeInvoices: true, canUseInvoices: true, showUpsell: false, isReady: true };
  }
  return { canSeeInvoices: true, canUseInvoices: false, showUpsell: true, isReady: true };
}

/**
 * Owner invoices feature flags (compile-time).
 *
 * **Prod test:** `INVOICE_EARLY_ACCESS_EMAILS` is non-empty, so only those
 * logins see More → Invoices and the invoice screens. Clear the array to
 * open the feature to every owner with Pro.
 */

/**
 * Temporary early-access login emails (lowercase).
 * Non-empty = ONLY these emails get invoices.
 * Empty = open to every owner with Pro.
 *
 * @type {readonly string[]}
 */
export const INVOICE_EARLY_ACCESS_EMAILS = ['jesuss387@gmail.com'];

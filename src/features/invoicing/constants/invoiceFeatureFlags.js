/**
 * Owner invoices feature flags (compile-time).
 *
 * **Open:** `INVOICE_EARLY_ACCESS_EMAILS` is empty — every office owner sees
 * More → Invoices. Pro uses the list. Everyone else gets the subscribe card.
 * Put emails back in the array to restrict it again.
 */

/**
 * Optional early-access login emails (lowercase).
 * Empty = every office owner sees invoices. Pro uses the list; others see the subscribe card.
 * Non-empty = ONLY these emails get invoices.
 *
 * @type {readonly string[]}
 */
export const INVOICE_EARLY_ACCESS_EMAILS = [];

/**
 * Where the create-invoice wizard was opened from.
 * Invoices is the only caller today. A booking or Home can pass the same route
 * params later without a second form.
 */
export const CREATE_INVOICE_SOURCE = Object.freeze({
  INVOICES: 'invoices',
  BOOKING: 'booking',
  HOME: 'home',
});

/**
 * @typedef {object} CreateInvoiceCustomerSeed
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [phone]
 *
 * @typedef {object} CreateInvoiceLineSeed
 * @property {string} name
 * @property {number} [qty]
 * @property {number} [unitPrice]
 *
 * Route params for `ROUTES.CREATE_INVOICE`.
 * @typedef {object} CreateInvoiceLaunchParams
 * @property {'invoices' | 'booking' | 'home'} [source]
 * @property {string} [bookingId]
 * @property {CreateInvoiceCustomerSeed} [customer]
 * @property {CreateInvoiceLineSeed[]} [lineItems]
 */

/** One subject per screen. Order is the create flow. */
export const CREATE_INVOICE_STEPS = [
  { id: 'customer', title: 'Billed to' },
  { id: 'due', title: 'Due date' },
  { id: 'services', title: 'Services' },
  { id: 'notes', title: 'Notes' },
];

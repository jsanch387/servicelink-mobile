import { INVOICE_STATUS } from './invoiceStatuses';

/**
 * Design fixtures for the invoices screen. Not loaded from the database.
 *
 * @typedef {object} MockInvoiceLine
 * @property {string} id
 * @property {string} name
 * @property {number} qty
 * @property {number} unitPrice
 *
 * @typedef {object} MockInvoice
 * @property {string} id
 * @property {string} number
 * @property {string} customerName
 * @property {string} customerEmail
 * @property {string} customerPhone
 * @property {string} serviceLabel
 * @property {number} amount Invoice total in dollars.
 * @property {string} status
 * @property {string} dateLabel Shown in the card date column.
 * @property {string} dueDateLabel
 * @property {string} [settledLabel]
 * @property {string} notes
 * @property {MockInvoiceLine[]} lineItems
 */

/** @type {MockInvoice[]} */
export const MOCK_INVOICES = [
  {
    id: 'mock-inv-1042',
    number: 'INV-1042',
    customerName: 'Riley Chen',
    customerEmail: 'riley@example.com',
    customerPhone: '(512) 555-0148',
    serviceLabel: 'Full detail',
    amount: 285,
    status: INVOICE_STATUS.SENT,
    dateLabel: 'Sep 12, 2026',
    dueDateLabel: 'September 12, 2026',
    notes: 'Full detail done and complete.',
    lineItems: [{ id: 'line-1042-1', name: 'Full detail', qty: 1, unitPrice: 285 }],
  },
  {
    id: 'mock-inv-1048',
    number: 'INV-1048',
    customerName: 'Jordan Lee',
    customerEmail: 'jordan@example.com',
    customerPhone: '(512) 555-0101',
    serviceLabel: 'Full interior + exterior',
    amount: 210,
    status: INVOICE_STATUS.SENT,
    dateLabel: 'Oct 6, 2026',
    dueDateLabel: 'October 6, 2026',
    notes: 'Pet hair add-on included.',
    lineItems: [
      { id: 'line-1048-1', name: 'Interior detail', qty: 1, unitPrice: 140 },
      { id: 'line-1048-2', name: 'Exterior wash', qty: 1, unitPrice: 70 },
    ],
  },
  {
    id: 'mock-inv-1047',
    number: 'INV-1047',
    customerName: 'Sam Rivera',
    customerEmail: 'sam.rivera@example.com',
    customerPhone: '(305) 555-0199',
    serviceLabel: 'Ceramic coating',
    amount: 650,
    status: INVOICE_STATUS.SENT,
    dateLabel: 'Oct 3, 2026',
    dueDateLabel: 'October 3, 2026',
    notes: 'SUV ceramic coating, 3-year.',
    lineItems: [{ id: 'line-1047-1', name: 'Ceramic coating', qty: 1, unitPrice: 650 }],
  },
  {
    id: 'mock-inv-1046',
    number: 'INV-1046',
    customerName: 'Morgan Patel',
    customerEmail: 'morgan.p@example.com',
    customerPhone: '(737) 555-0166',
    serviceLabel: 'Interior detail',
    amount: 280,
    status: INVOICE_STATUS.SENT,
    dateLabel: 'Oct 2, 2026',
    dueDateLabel: 'October 2, 2026',
    notes: 'Interior shampoo, mats, and leather conditioner.',
    lineItems: [{ id: 'line-1046-1', name: 'Interior detail', qty: 1, unitPrice: 280 }],
  },
  {
    id: 'mock-inv-1049',
    number: 'INV-1049',
    customerName: 'Taylor Brooks',
    customerEmail: 'taylor.b@example.com',
    customerPhone: '(206) 555-0114',
    serviceLabel: 'Paint correction',
    amount: 420,
    status: INVOICE_STATUS.DRAFT,
    dateLabel: 'Sep 28, 2026',
    dueDateLabel: 'October 5, 2026',
    notes: 'Two-stage correction on hood and doors.',
    lineItems: [
      { id: 'line-1049-1', name: 'Paint correction', qty: 1, unitPrice: 320 },
      { id: 'line-1049-2', name: 'Finishing polish', qty: 1, unitPrice: 100 },
    ],
  },
  {
    id: 'mock-inv-1039',
    number: 'INV-1039',
    customerName: 'Alex Kim',
    customerEmail: 'alex.kim@example.com',
    customerPhone: '(415) 555-0142',
    serviceLabel: 'Express detail',
    amount: 95,
    status: INVOICE_STATUS.PAID,
    dateLabel: 'Sep 22, 2026',
    dueDateLabel: 'September 22, 2026',
    settledLabel: 'Sep 22',
    notes: 'Express exterior wash, tire shine, interior vacuum.',
    lineItems: [{ id: 'line-1039-1', name: 'Express detail', qty: 1, unitPrice: 95 }],
  },
  {
    id: 'mock-inv-1036',
    number: 'INV-1036',
    customerName: 'Avery Cole',
    customerEmail: 'avery.cole@example.com',
    customerPhone: '(512) 555-0177',
    serviceLabel: 'Maintenance wash',
    amount: 65,
    status: INVOICE_STATUS.PAID,
    dateLabel: 'Sep 18, 2026',
    dueDateLabel: 'September 18, 2026',
    settledLabel: 'Sep 18',
    notes: 'Monthly maintenance wash.',
    lineItems: [{ id: 'line-1036-1', name: 'Maintenance wash', qty: 1, unitPrice: 65 }],
  },
  {
    id: 'mock-inv-1031',
    number: 'INV-1031',
    customerName: 'Casey Nguyen',
    customerEmail: 'casey.nguyen@example.com',
    customerPhone: '(512) 555-0133',
    serviceLabel: 'Headlight restoration',
    amount: 75,
    status: INVOICE_STATUS.VOIDED,
    dateLabel: 'Sep 2, 2026',
    dueDateLabel: 'September 2, 2026',
    notes: 'Canceled before the appointment.',
    lineItems: [{ id: 'line-1031-1', name: 'Headlight restoration', qty: 1, unitPrice: 75 }],
  },
];

/**
 * @param {string | undefined} invoiceId
 * @returns {MockInvoice | null}
 */
export function getMockInvoice(invoiceId) {
  const id = String(invoiceId ?? '').trim();
  if (!id) return null;
  return MOCK_INVOICES.find((invoice) => invoice.id === id) ?? null;
}

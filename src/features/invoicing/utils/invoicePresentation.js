import { INVOICE_FILTER, INVOICE_STATUS, INVOICE_STATUS_LABEL } from '../constants/invoiceStatuses';
import { formatInvoiceDollars, formatInvoiceDocumentDollars } from './formatInvoiceMoney';

/**
 * @param {import('../constants/mockInvoices').MockInvoice[]} invoices
 */
export function summarizeOpenInvoices(invoices) {
  const open = (invoices ?? []).filter((invoice) => invoice.status === INVOICE_STATUS.SENT);
  const total = open.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
  const count = open.length;
  const caption = count === 1 ? '1 still open' : `${count} still open`;
  return { count, total, caption };
}

/**
 * @param {import('../constants/mockInvoices').MockInvoice[]} invoices
 * @param {string} filter
 */
export function filterInvoices(invoices, filter) {
  const rows = invoices ?? [];
  if (filter === INVOICE_FILTER.SENT) {
    return rows.filter((invoice) => invoice.status === INVOICE_STATUS.SENT);
  }
  if (filter === INVOICE_FILTER.PAID) {
    return rows.filter((invoice) => invoice.status === INVOICE_STATUS.PAID);
  }
  if (filter === INVOICE_FILTER.DRAFT) {
    return rows.filter((invoice) => invoice.status === INVOICE_STATUS.DRAFT);
  }
  return rows;
}

/**
 * @param {import('../constants/mockInvoices').MockInvoice} invoice
 */
function invoiceNumberLabel(number) {
  const digits = String(number ?? '').replace(/^INV-/i, '');
  return digits ? `#${digits}` : '';
}

export function invoiceRowModel(invoice) {
  return {
    amountLabel: formatInvoiceDollars(invoice.amount),
    numberLabel: invoiceNumberLabel(invoice.number),
    dateLabel: invoice.dateLabel ?? '',
    statusLabel: INVOICE_STATUS_LABEL[invoice.status] ?? 'Invoice',
    voided: invoice.status === INVOICE_STATUS.VOIDED,
  };
}

/**
 * Paper invoice: line items, what was paid, and what is still owed.
 *
 * @param {import('../constants/mockInvoices').MockInvoice} invoice
 */
export function invoiceDocumentModel(invoice) {
  const voided = invoice.status === INVOICE_STATUS.VOIDED;
  const paid = invoice.status === INVOICE_STATUS.PAID;
  const lineItems = (invoice.lineItems ?? []).map((item) => {
    const qty = Number(item.qty) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const amount = Math.round(qty * unitPrice * 100) / 100;
    return {
      id: item.id,
      name: item.name,
      qtyLabel: String(qty),
      unitPriceLabel: formatInvoiceDocumentDollars(unitPrice),
      amountLabel: formatInvoiceDocumentDollars(amount),
      amount,
    };
  });
  const subtotal =
    Math.round(lineItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100 ||
    Number(invoice.amount) ||
    0;
  const amountDue = !voided && !paid;

  return {
    numberLabel: invoiceNumberLabel(invoice.number),
    statusLabel: INVOICE_STATUS_LABEL[invoice.status] ?? 'Invoice',
    dueDateLabel: invoice.dueDateLabel || invoice.dateLabel || '',
    lineItems,
    subtotalLabel: formatInvoiceDocumentDollars(subtotal),
    showPaid: paid,
    paidLabel: formatInvoiceDocumentDollars(subtotal),
    showBalance: amountDue,
    balanceTitle: 'Amount due',
    balanceLabel: formatInvoiceDocumentDollars(subtotal),
    voided,
    notes: String(invoice.notes ?? '').trim(),
  };
}

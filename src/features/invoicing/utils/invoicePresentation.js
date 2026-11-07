import { INVOICE_FILTER, INVOICE_STATUS, INVOICE_STATUS_LABEL } from '../constants/invoiceStatuses';
import { formatTaxLineLabel } from '../../payments/utils/taxRateModel';
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
 * @param {import('../constants/mockInvoices').MockInvoice[]} invoices
 * @param {string} query
 */
export function searchInvoices(invoices, query) {
  const needle = String(query ?? '')
    .trim()
    .toLowerCase();
  if (!needle) return invoices ?? [];
  return (invoices ?? []).filter((invoice) => {
    const haystack = [
      invoice.customerName,
      invoice.customerEmail,
      invoice.customerPhone,
      invoice.number,
      invoice.serviceLabel,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}

/**
 * @param {import('../constants/mockInvoices').MockInvoice} invoice
 */
const FILTERED_EMPTY_BODY = 'Invoices in this status will show up here.';

/**
 * @param {string | number | null | undefined} number
 */
function invoiceNumberLabel(number) {
  if (number == null) return '—';
  const digits = String(number).trim().replace(/^INV-/i, '');
  if (!digits || digits.toLowerCase() === 'null') return '—';
  return `#${digits}`;
}

/**
 * @param {string | null | undefined} status
 */
export function isVoidInvoiceStatus(status) {
  const value = String(status ?? '').toLowerCase();
  return value === INVOICE_STATUS.VOID || value === INVOICE_STATUS.VOIDED;
}

/**
 * Empty list copy for the current pill. A search with no hits uses its own line.
 *
 * @param {string} filter
 * @param {string} [query]
 * @returns {{ title: string, body: string }}
 */
export function invoiceListEmptyCopy(filter, query) {
  if (String(query ?? '').trim()) {
    return { title: 'No invoices match that search.', body: '' };
  }
  if (filter === INVOICE_FILTER.DRAFT) {
    return { title: 'No drafts', body: FILTERED_EMPTY_BODY };
  }
  if (filter === INVOICE_FILTER.SENT) {
    return { title: 'No sent invoices', body: FILTERED_EMPTY_BODY };
  }
  if (filter === INVOICE_FILTER.PAID) {
    return { title: 'No paid invoices', body: FILTERED_EMPTY_BODY };
  }
  return {
    title: 'No invoices yet',
    body: 'Send your customer an invoice for the work.',
  };
}

export function invoiceRowModel(invoice) {
  return {
    amountLabel: formatInvoiceDollars(invoice.amount),
    numberLabel: invoiceNumberLabel(invoice.number),
    dateLabel: invoice.dateLabel ?? '',
    statusLabel: INVOICE_STATUS_LABEL[invoice.status] ?? 'Invoice',
    voided: isVoidInvoiceStatus(invoice.status),
  };
}

/**
 * Paper invoice: line items, what was paid, and what is still owed.
 *
 * @param {import('../constants/mockInvoices').MockInvoice} invoice
 */
function billStatusLabel(status) {
  if (status === INVOICE_STATUS.PAID) return 'Paid';
  if (status === INVOICE_STATUS.VOID) return 'Void';
  if (status === INVOICE_STATUS.SENT) return 'Unpaid';
  return 'Invoice';
}

function positiveCents(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function taxRateBps(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : null;
}

function dollarsFromCents(cents) {
  return Math.round(Number(cents) || 0) / 100;
}

export function invoiceDocumentModel(invoice) {
  const isBill = invoice.presentation === 'bill';
  const voided = isVoidInvoiceStatus(invoice.status);
  const paid = invoice.status === INVOICE_STATUS.PAID;
  const lineItems = (invoice.lineItems ?? []).map((item) => {
    const qty = Number(item.qty) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const amount =
      isBill && Number.isFinite(Number(item.amount))
        ? Number(item.amount)
        : Math.round(qty * unitPrice * 100) / 100;
    return {
      id: item.id,
      name: item.name,
      qtyLabel: String(qty),
      unitPriceLabel: formatInvoiceDocumentDollars(unitPrice),
      amountLabel: formatInvoiceDocumentDollars(amount),
      amount,
    };
  });
  const lineSum = Math.round(lineItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const storedTaxCents = positiveCents(invoice.taxCents ?? invoice.tax_cents);
  const storedRate = taxRateBps(invoice.taxRateBps ?? invoice.tax_rate_bps);
  const subtotal = isBill
    ? invoice.subtotalCents != null
      ? dollarsFromCents(invoice.subtotalCents)
      : Number(invoice.amount) || 0
    : lineSum || Number(invoice.amount) || 0;
  const total = isBill
    ? invoice.totalCents != null
      ? dollarsFromCents(invoice.totalCents)
      : Number(invoice.amount) || 0
    : Math.round((subtotal + storedTaxCents / 100) * 100) / 100;
  const amountDue = !voided && !paid;
  const totalLabel = formatInvoiceDocumentDollars(total);

  return {
    numberLabel: invoiceNumberLabel(invoice.number),
    statusLabel: isBill
      ? billStatusLabel(invoice.status)
      : (INVOICE_STATUS_LABEL[invoice.status] ?? 'Invoice'),
    dueDateLabel: invoice.dueDateLabel || invoice.dateLabel || '',
    lineItems,
    subtotalLabel: formatInvoiceDocumentDollars(subtotal),
    taxLabel: storedTaxCents > 0 ? formatTaxLineLabel(storedRate) : null,
    taxValueLabel: storedTaxCents > 0 ? formatInvoiceDocumentDollars(storedTaxCents / 100) : null,
    showPaid: paid,
    paidLabel: totalLabel,
    showBalance: amountDue,
    balanceTitle: 'Amount due',
    balanceLabel: totalLabel,
    totalLabel,
    voided,
    voidLabel: isBill && invoice.status === INVOICE_STATUS.VOID ? 'Void' : 'Voided',
    notes: String(invoice.notes ?? '').trim(),
  };
}

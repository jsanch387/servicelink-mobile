import { parseLocalYyyyMmDd } from '../../../components/ui';
import { isValidEmailFormat } from '../../../utils/email';
import { canonicalNanpDigits } from '../../../utils/phone';
import { CREATE_INVOICE_SOURCE } from '../constants/createInvoiceWizard';
import { INVOICE_STATUS } from '../constants/invoiceStatuses';

/**
 * @typedef {object} InvoiceDraftLine
 * @property {string} id
 * @property {string} name
 * @property {string} qty
 * @property {string} unitPrice
 *
 * @typedef {object} InvoiceDraft
 * @property {'invoices' | 'booking' | 'home'} source
 * @property {string | null} bookingId
 * @property {string} customerName
 * @property {string} customerEmail
 * @property {string} customerPhone
 * @property {InvoiceDraftLine[]} lineItems
 * @property {string} dueDateYyyyMmDd
 * @property {string} notes
 */

let lineSerial = 0;

export function createInvoiceLineItem(seed = {}) {
  lineSerial += 1;
  return {
    id: `line-${lineSerial}`,
    name: seed.name ?? '',
    qty: seed.qty == null || seed.qty === '' ? '1' : String(seed.qty),
    unitPrice: seed.unitPrice == null || seed.unitPrice === '' ? '' : String(seed.unitPrice),
  };
}

export function createEmptyInvoiceDraft() {
  return {
    source: CREATE_INVOICE_SOURCE.INVOICES,
    bookingId: null,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    lineItems: [],
    dueDateYyyyMmDd: '',
    notes: '',
  };
}

/**
 * @param {import('../constants/createInvoiceWizard').CreateInvoiceLaunchParams} [params]
 * @returns {InvoiceDraft}
 */
export function seedCreateInvoiceDraft(params = {}) {
  const draft = createEmptyInvoiceDraft();
  draft.source = params.source || CREATE_INVOICE_SOURCE.INVOICES;
  draft.bookingId = params.bookingId ? String(params.bookingId) : null;
  if (params.customer) {
    draft.customerName = params.customer.name ?? '';
    draft.customerEmail = params.customer.email ?? '';
    draft.customerPhone = params.customer.phone ?? '';
  }
  if (Array.isArray(params.lineItems) && params.lineItems.length > 0) {
    draft.lineItems = params.lineItems.map((item) =>
      createInvoiceLineItem({
        name: item.name ?? '',
        qty: item.qty,
        unitPrice: item.unitPrice,
      }),
    );
  }
  return draft;
}

export function parseInvoiceMoneyInput(text) {
  const cleaned = String(text ?? '').replace(/[^0-9.]/g, '');
  if (!cleaned || cleaned === '.') return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

export function parseInvoiceQtyInput(text) {
  const digits = String(text ?? '').replace(/[^0-9]/g, '');
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isFinite(value) || value < 1) return null;
  return value;
}

function linePrice(line) {
  const raw = String(line.unitPrice ?? '').trim();
  if (!raw) return 0;
  return parseInvoiceMoneyInput(raw);
}

function lineIsComplete(line) {
  const price = linePrice(line);
  const qty = parseInvoiceQtyInput(line.qty);
  return Boolean(line.name.trim()) && price != null && qty != null;
}

function customerCanContinue(draft) {
  if (!draft.customerName.trim()) return false;
  const email = draft.customerEmail.trim();
  const phoneDigits = canonicalNanpDigits(draft.customerPhone);
  if (email && !isValidEmailFormat(email)) return false;
  if (phoneDigits.length > 0 && phoneDigits.length < 10) return false;
  const hasEmail = Boolean(email) && isValidEmailFormat(email);
  const hasPhone = phoneDigits.length >= 10;
  return hasEmail || hasPhone;
}

function itemsCanContinue(draft) {
  const lines = draft.lineItems ?? [];
  if (!lines.length) return false;
  return lines.every(lineIsComplete);
}

/**
 * Whether the current step has enough to move on. Notes are optional.
 *
 * @param {'customer' | 'due' | 'services' | 'notes'} step
 * @param {InvoiceDraft} draft
 */
export function canContinueInvoiceStep(step, draft) {
  if (step === 'customer') return customerCanContinue(draft);
  if (step === 'due') return Boolean(parseLocalYyyyMmDd(draft.dueDateYyyyMmDd));
  if (step === 'services') return itemsCanContinue(draft);
  return true;
}

/**
 * The invoice can be saved when billed-to, due date, and services are usable.
 *
 * @param {InvoiceDraft} draft
 */
export function canCreateInvoice(draft) {
  return (
    canContinueInvoiceStep('customer', draft) &&
    canContinueInvoiceStep('due', draft) &&
    canContinueInvoiceStep('services', draft)
  );
}

export function invoiceDraftTotal(draft) {
  return (draft.lineItems ?? []).reduce((sum, line) => {
    if (!lineIsComplete(line)) return sum;
    const qty = parseInvoiceQtyInput(line.qty) ?? 0;
    const price = linePrice(line) ?? 0;
    return Math.round((sum + qty * price) * 100) / 100;
  }, 0);
}

function formatLongDate(yyyyMmDd) {
  const date = parseLocalYyyyMmDd(yyyyMmDd);
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Turn a finished draft into the same shape the list and document already render.
 *
 * @param {InvoiceDraft} draft
 * @param {{ id: string, number: string }} identity
 * @param {string} [status]
 */
export function buildInvoiceFromDraft(draft, identity, status = INVOICE_STATUS.DRAFT) {
  const lines = (draft.lineItems ?? []).filter(lineIsComplete).map((line) => ({
    id: line.id,
    name: line.name.trim(),
    qty: parseInvoiceQtyInput(line.qty) ?? 1,
    unitPrice: parseInvoiceMoneyInput(line.unitPrice) ?? 0,
  }));
  const firstName = lines[0]?.name ?? 'Invoice';
  const serviceLabel = lines.length > 1 ? `${firstName} + ${lines.length - 1} more` : firstName;
  const today = new Date();

  return {
    id: identity.id,
    number: identity.number,
    customerName: draft.customerName.trim(),
    customerEmail: draft.customerEmail.trim(),
    customerPhone: draft.customerPhone.trim(),
    serviceLabel,
    amount: invoiceDraftTotal(draft),
    status,
    dateLabel: formatShortDate(today),
    dueDateLabel: formatLongDate(draft.dueDateYyyyMmDd),
    notes: draft.notes.trim(),
    lineItems: lines,
    source: draft.source,
    bookingId: draft.bookingId,
  };
}

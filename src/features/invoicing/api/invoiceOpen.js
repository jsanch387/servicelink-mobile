import { supabase } from '../../../lib/supabase';
import { formatPhoneForDisplay } from '../../../utils/phone';
import { CREATE_INVOICE_SOURCE } from '../constants/createInvoiceWizard';
import { formatInvoiceDueDate, invoiceCentsToDollars } from './invoices';

const STATUS_SELECT = 'status';
const DRAFT_SELECT = 'id, status, customer_name, customer_email, customer_phone, note, due_on';
const DRAFT_LINE_SELECT = 'id, position, description, quantity, unit_amount_cents';
const BILL_SELECT =
  'id, status, invoice_number, customer_name, customer_email, customer_phone, due_on, note, total_cents, short_code';
const BILL_LINE_SELECT = 'id, description, quantity, unit_amount_cents, amount_cents, position';

const BILL_STATUSES = new Set(['sent', 'paid', 'void']);

/**
 * @param {string | null | undefined} name
 */
export function invoiceBusinessName(name) {
  const trimmed = String(name ?? '').trim();
  return trimmed || 'Invoice';
}

/**
 * @param {unknown} status
 */
function normalizeStatus(status) {
  return String(status ?? '')
    .trim()
    .toLowerCase();
}

/**
 * @param {unknown} value
 */
function lineQuantity(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.trunc(n);
}

/**
 * @param {unknown} cents
 */
function centsToPriceInput(cents) {
  const dollars = invoiceCentsToDollars(cents);
  const rounded = Math.round(dollars * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2);
}

/**
 * @param {string | null | undefined} dueOn
 */
function dueDateKey(dueOn) {
  const raw = String(dueOn ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}

/**
 * @param {string | null | undefined} email
 */
function storedEmail(email) {
  if (email == null) return '';
  const raw = String(email);
  return raw.trim() ? raw : '';
}

/**
 * @param {string | null | undefined} phone
 */
function displayPhone(phone) {
  if (phone == null) return '';
  const raw = String(phone).trim();
  if (!raw) return '';
  return formatPhoneForDisplay(raw);
}

/**
 * @param {object[]} lines
 */
function sortLines(lines) {
  return [...lines].sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
}

/**
 * @param {object} line
 */
function lineName(line) {
  const name = String(line?.description ?? '').trim();
  return name || 'Item';
}

/**
 * Draft editor shape. Line amount is quantity × unit cents, not a selected column.
 *
 * @param {object} invoice
 * @param {object[]} lines
 */
export function mapOpenedDraft(invoice, lines) {
  return {
    source: CREATE_INVOICE_SOURCE.INVOICES,
    bookingId: null,
    customerName: String(invoice?.customer_name ?? '').trim(),
    customerEmail: storedEmail(invoice?.customer_email),
    customerPhone: displayPhone(invoice?.customer_phone),
    dueDateYyyyMmDd: dueDateKey(invoice?.due_on),
    notes: String(invoice?.note ?? '').trim(),
    lineItems: sortLines(lines).map((line) => ({
      id: String(line.id),
      name: lineName(line),
      qty: String(lineQuantity(line.quantity)),
      unitPrice: centsToPriceInput(line.unit_amount_cents),
    })),
  };
}

/**
 * Bill document shape. Totals use `total_cents`, not a sum of the lines.
 *
 * @param {object} invoice
 * @param {object[]} lines
 */
export function mapOpenedBill(invoice, lines) {
  const email = storedEmail(invoice?.customer_email);
  const phone = displayPhone(invoice?.customer_phone);
  const customerName = String(invoice?.customer_name ?? '').trim();
  return {
    presentation: 'bill',
    id: String(invoice?.id ?? ''),
    status: normalizeStatus(invoice?.status),
    number: invoice?.invoice_number,
    customerName: customerName || '—',
    customerEmail: email,
    customerPhone: phone,
    dueDateLabel: formatInvoiceDueDate(invoice?.due_on, 'long'),
    notes: String(invoice?.note ?? '').trim(),
    amount: invoiceCentsToDollars(invoice?.total_cents),
    shortCode: String(invoice?.short_code ?? '').trim(),
    lineItems: sortLines(lines).map((line) => ({
      id: String(line.id),
      name: lineName(line),
      qty: lineQuantity(line.quantity),
      unitPrice: invoiceCentsToDollars(line.unit_amount_cents),
      amount: invoiceCentsToDollars(line.amount_cents),
    })),
  };
}

/**
 * @param {string} invoiceId
 * @param {string} businessId
 * @param {string} columns
 */
function invoiceById(invoiceId, businessId, columns) {
  return supabase
    .from('invoices')
    .select(columns)
    .eq('id', invoiceId)
    .eq('business_id', businessId)
    .maybeSingle();
}

/**
 * @param {string} invoiceId
 * @param {string} columns
 */
function lineItems(invoiceId, columns) {
  return supabase
    .from('invoice_line_items')
    .select(columns)
    .eq('invoice_id', invoiceId)
    .order('position', { ascending: true });
}

/**
 * Status first, then the draft editor or the bill.
 * Any miss returns `{ outcome: 'leave' }` so the screen can go back.
 *
 * @param {string} businessId
 * @param {string} invoiceId
 * @returns {Promise<{ outcome: 'leave' } | { outcome: 'draft'; draft: ReturnType<typeof mapOpenedDraft> } | { outcome: 'bill'; invoice: ReturnType<typeof mapOpenedBill> }>}
 */
export async function fetchInvoiceForOpen(businessId, invoiceId) {
  const id = String(invoiceId ?? '').trim();
  if (!id || !businessId) return { outcome: 'leave' };

  const statusRes = await invoiceById(id, businessId, STATUS_SELECT);
  if (statusRes.error || !statusRes.data) return { outcome: 'leave' };

  const status = normalizeStatus(statusRes.data.status);
  if (status === 'draft') return fetchOpenedDraft(businessId, id);
  if (BILL_STATUSES.has(status)) return fetchOpenedBill(businessId, id);
  return { outcome: 'leave' };
}

/**
 * @param {string} businessId
 * @param {string} invoiceId
 */
async function fetchOpenedDraft(businessId, invoiceId) {
  const { data: invoice, error } = await invoiceById(invoiceId, businessId, DRAFT_SELECT);
  if (error || !invoice || normalizeStatus(invoice.status) !== 'draft') {
    return { outcome: 'leave' };
  }

  const { data: lines, error: lineError } = await lineItems(invoiceId, DRAFT_LINE_SELECT);
  if (lineError || !Array.isArray(lines)) return { outcome: 'leave' };
  return { outcome: 'draft', draft: mapOpenedDraft(invoice, lines) };
}

/**
 * @param {string} businessId
 * @param {string} invoiceId
 */
async function fetchOpenedBill(businessId, invoiceId) {
  const { data: invoice, error } = await invoiceById(invoiceId, businessId, BILL_SELECT);
  const status = normalizeStatus(invoice?.status);
  if (error || !invoice || !BILL_STATUSES.has(status) || invoice.invoice_number == null) {
    return { outcome: 'leave' };
  }

  const { data: lines, error: lineError } = await lineItems(invoiceId, BILL_LINE_SELECT);
  if (lineError || !Array.isArray(lines)) return { outcome: 'leave' };
  return { outcome: 'bill', invoice: mapOpenedBill(invoice, lines) };
}

import { supabase } from '../../../lib/supabase';

/** List columns only. Customer link secrets stay off this screen. */
const INVOICE_LIST_SELECT =
  'id, status, customer_name, total_cents, due_on, created_at, invoice_number';

/**
 * @param {number | string | null | undefined} cents
 */
export function invoiceCentsToDollars(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n / 100;
}

/**
 * @param {string | null | undefined} name
 */
export function invoiceCustomerName(name) {
  const trimmed = String(name ?? '').trim();
  return trimmed || 'Untitled';
}

/**
 * Calendar date at local noon so `YYYY-MM-DD` does not shift a day.
 *
 * @param {string | null | undefined} dueOn
 * @param {'short' | 'long'} [monthStyle]
 */
export function formatInvoiceDueDate(dueOn, monthStyle = 'short') {
  const raw = String(dueOn ?? '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return 'No due date';
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day, 12, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return 'No due date';
  }
  return date.toLocaleDateString('en-US', {
    month: monthStyle === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * @param {number | string | null | undefined} value
 * @returns {number | null}
 */
function mapInvoiceNumber(value) {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/**
 * List row. `created_at` is selected for sort only and is not kept.
 *
 * @param {object} row
 */
export function mapInvoiceRow(row) {
  return {
    id: String(row?.id ?? ''),
    status: String(row?.status ?? '')
      .trim()
      .toLowerCase(),
    customerName: invoiceCustomerName(row?.customer_name),
    amount: invoiceCentsToDollars(row?.total_cents),
    number: mapInvoiceNumber(row?.invoice_number),
    dateLabel: formatInvoiceDueDate(row?.due_on),
  };
}

/**
 * Owner or active teammate select. RLS is the only server check.
 * An empty shop is `{ data: [], error: null }`.
 *
 * @param {string} businessId
 */
export async function fetchInvoicesForBusiness(businessId) {
  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_LIST_SELECT)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error };
  return { data: (data ?? []).map(mapInvoiceRow), error: null };
}

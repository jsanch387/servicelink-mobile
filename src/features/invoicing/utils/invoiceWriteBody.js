import { canonicalNanpDigits } from '../../../utils/phone';
import { parseInvoiceMoneyInput, parseInvoiceQtyInput } from './createInvoiceDraft';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function invoiceUuidOrNull(value) {
  const id = String(value ?? '').trim();
  return UUID_RE.test(id) ? id : null;
}

/**
 * Save and send share this JSON. `amount` is the unit price in dollars, not cents.
 * `invoiceId` is included only for send, and only when it is a UUID.
 *
 * @param {import('./createInvoiceDraft').InvoiceDraft} draft
 * @param {{ invoiceId?: string | null; includeInvoiceId?: boolean }} [options]
 */
export function buildInvoiceWriteBody(draft, options = {}) {
  const lines = (draft?.lineItems ?? [])
    .map((line) => {
      const description = String(line?.name ?? '').trim();
      const amount = parseInvoiceMoneyInput(line?.unitPrice);
      const qty = parseInvoiceQtyInput(line?.qty);
      if (!description || amount == null || qty == null) return null;
      return {
        description,
        quantity: String(qty),
        amount: amount.toFixed(2),
      };
    })
    .filter(Boolean);

  const phoneDigits = canonicalNanpDigits(draft?.customerPhone);
  /** @type {Record<string, unknown>} */
  const body = {
    customerName: String(draft?.customerName ?? '').trim(),
    customerEmail: String(draft?.customerEmail ?? '').trim(),
    customerPhone: phoneDigits,
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(String(draft?.dueDateYyyyMmDd ?? ''))
      ? draft.dueDateYyyyMmDd
      : '',
    note: String(draft?.notes ?? '').trim(),
    lines,
  };

  const bookingId = invoiceUuidOrNull(draft?.bookingId);
  if (bookingId) body.bookingId = bookingId;

  if (options.includeInvoiceId) {
    const invoiceId = invoiceUuidOrNull(options.invoiceId);
    if (invoiceId) body.invoiceId = invoiceId;
  }

  return body;
}

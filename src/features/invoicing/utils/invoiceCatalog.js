import { useSyncExternalStore } from 'react';
import { INVOICE_STATUS } from '../constants/invoiceStatuses';
import { MOCK_INVOICES } from '../constants/mockInvoices';
import { buildInvoiceFromDraft } from './createInvoiceDraft';

function cloneInvoices(rows) {
  return rows.map((row) => ({
    ...row,
    lineItems: (row.lineItems ?? []).map((line) => ({ ...line })),
  }));
}

let invoices = cloneInvoices(MOCK_INVOICES);
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getInvoiceCatalog() {
  return invoices;
}

export function subscribeInvoiceCatalog(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInvoiceCatalog() {
  return useSyncExternalStore(subscribeInvoiceCatalog, getInvoiceCatalog, getInvoiceCatalog);
}

export function peekNextInvoiceNumber() {
  const max = invoices.reduce((highest, row) => {
    const digits = Number(String(row.number ?? '').replace(/\D/g, ''));
    return Number.isFinite(digits) ? Math.max(highest, digits) : highest;
  }, 1000);
  return `INV-${max + 1}`;
}

/**
 * @param {import('./createInvoiceDraft').InvoiceDraft} draft
 * @param {string} [status]
 */
export function addInvoice(draft, status = INVOICE_STATUS.DRAFT) {
  const invoice = buildInvoiceFromDraft(
    draft,
    {
      id: `local-inv-${Date.now()}`,
      number: peekNextInvoiceNumber(),
    },
    status,
  );
  invoices = [invoice, ...invoices];
  emit();
  return invoice;
}

/**
 * @param {import('./createInvoiceDraft').InvoiceDraft} draft
 */
export function addDraftInvoice(draft) {
  return addInvoice(draft, INVOICE_STATUS.DRAFT);
}

/** Test helper. Restores the design fixtures. */
export function resetInvoiceCatalog() {
  invoices = cloneInvoices(MOCK_INVOICES);
  emit();
}

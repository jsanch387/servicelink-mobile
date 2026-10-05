/** @type {const} */
export const INVOICES_QUERY_ROOT = ['invoices'];

export function invoicesListQueryKey(businessId) {
  return [...INVOICES_QUERY_ROOT, 'list', businessId ?? 'none'];
}

export function invoiceOpenQueryKey(businessId, invoiceId) {
  return [...INVOICES_QUERY_ROOT, 'open', businessId ?? 'none', invoiceId ?? 'none'];
}

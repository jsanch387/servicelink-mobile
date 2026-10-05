export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  /** Database value on `public.invoices`. */
  VOID: 'void',
  /** Design fixtures still use this spelling. */
  VOIDED: 'voided',
};

export const INVOICE_STATUS_LABEL = {
  [INVOICE_STATUS.DRAFT]: 'Draft',
  [INVOICE_STATUS.SENT]: 'Sent',
  [INVOICE_STATUS.PAID]: 'Paid',
  [INVOICE_STATUS.VOID]: 'Voided',
  [INVOICE_STATUS.VOIDED]: 'Voided',
};

export const INVOICE_FILTER = {
  ALL: 'all',
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
};

export const INVOICE_FILTER_OPTIONS = [
  { key: INVOICE_FILTER.ALL, label: 'All' },
  { key: INVOICE_FILTER.DRAFT, label: 'Draft' },
  { key: INVOICE_FILTER.SENT, label: 'Sent' },
  { key: INVOICE_FILTER.PAID, label: 'Paid' },
];

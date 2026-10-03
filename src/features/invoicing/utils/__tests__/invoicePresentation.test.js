import { INVOICE_FILTER } from '../../constants/invoiceStatuses';
import { MOCK_INVOICES } from '../../constants/mockInvoices';
import {
  filterInvoices,
  invoiceDocumentModel,
  invoiceRowModel,
  searchInvoices,
  summarizeOpenInvoices,
} from '../invoicePresentation';

describe('invoicePresentation', () => {
  it('sums sent invoices that are still owed', () => {
    const summary = summarizeOpenInvoices(MOCK_INVOICES);
    expect(summary).toEqual({ count: 4, total: 1425, caption: '4 still open' });
  });

  it('filters the mock list by sent, paid, and draft', () => {
    expect(filterInvoices(MOCK_INVOICES, INVOICE_FILTER.SENT)).toHaveLength(4);
    expect(filterInvoices(MOCK_INVOICES, INVOICE_FILTER.PAID)).toHaveLength(2);
    expect(filterInvoices(MOCK_INVOICES, INVOICE_FILTER.DRAFT)).toHaveLength(1);
    expect(filterInvoices(MOCK_INVOICES, INVOICE_FILTER.ALL)).toHaveLength(MOCK_INVOICES.length);
  });

  it('finds invoices by name, email, or number', () => {
    expect(searchInvoices(MOCK_INVOICES, 'riley').map((row) => row.id)).toEqual(['mock-inv-1042']);
    expect(searchInvoices(MOCK_INVOICES, '1042').map((row) => row.number)).toEqual(['INV-1042']);
    expect(searchInvoices(MOCK_INVOICES, '   ')).toHaveLength(MOCK_INVOICES.length);
    expect(searchInvoices(MOCK_INVOICES, 'nobody')).toHaveLength(0);
  });

  it('describes each status on the row', () => {
    const sent = MOCK_INVOICES.find((row) => row.id === 'mock-inv-1042');
    const paid = MOCK_INVOICES.find((row) => row.status === 'paid');
    const draft = MOCK_INVOICES.find((row) => row.status === 'draft');
    const voided = MOCK_INVOICES.find((row) => row.status === 'voided');

    expect(invoiceRowModel(sent)).toMatchObject({
      amountLabel: '$285',
      numberLabel: '#1042',
      dateLabel: 'Sep 12, 2026',
      statusLabel: 'Sent',
      voided: false,
    });
    expect(invoiceRowModel(paid).numberLabel).toBe('#1039');
    expect(invoiceRowModel(draft).dateLabel).toBe('Sep 28, 2026');
    expect(invoiceRowModel(voided)).toMatchObject({
      statusLabel: 'Voided',
      voided: true,
    });
  });

  it('builds the paper invoice totals from status', () => {
    const paid = MOCK_INVOICES.find((row) => row.id === 'mock-inv-1039');
    const sent = MOCK_INVOICES.find((row) => row.id === 'mock-inv-1042');
    const voided = MOCK_INVOICES.find((row) => row.status === 'voided');

    expect(invoiceDocumentModel(paid)).toMatchObject({
      numberLabel: '#1039',
      subtotalLabel: '$95.00',
      showPaid: true,
      paidLabel: '$95.00',
      showBalance: false,
      voided: false,
    });
    expect(invoiceDocumentModel(sent)).toMatchObject({
      showPaid: false,
      showBalance: true,
      balanceTitle: 'Amount due',
      balanceLabel: '$285.00',
      lineItems: [expect.objectContaining({ name: 'Full detail', amountLabel: '$285.00' })],
    });
    expect(invoiceDocumentModel(voided)).toMatchObject({
      showPaid: false,
      showBalance: false,
      voided: true,
      statusLabel: 'Voided',
    });
  });
});

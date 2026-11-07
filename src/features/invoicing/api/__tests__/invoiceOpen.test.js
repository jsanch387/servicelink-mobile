jest.mock('../../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../../lib/supabase';
import { formatInvoiceDueDate } from '../invoices';
import { fetchInvoiceForOpen, mapOpenedBill, mapOpenedDraft } from '../invoiceOpen';
import { invoiceDocumentModel } from '../../utils/invoicePresentation';

function queryResult(result) {
  const resolved = Promise.resolve(result);
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => resolved),
    maybeSingle: jest.fn(() => resolved),
  };
  return builder;
}

describe('mapOpenedDraft', () => {
  it('maps editor fields and prices lines from quantity times unit cents', () => {
    expect(
      mapOpenedDraft(
        {
          id: 'inv-1',
          status: 'draft',
          customer_name: '  Riley  ',
          customer_email: 'riley@example.com',
          customer_phone: '5125550148',
          note: '  Pet hair  ',
          due_on: '2026-10-03',
        },
        [
          {
            id: 'line-2',
            position: 1,
            description: 'Exterior',
            quantity: 1,
            unit_amount_cents: 7000,
          },
          {
            id: 'line-1',
            position: 0,
            description: '   ',
            quantity: 2,
            unit_amount_cents: 14000,
          },
        ],
      ),
    ).toMatchObject({
      customerName: 'Riley',
      customerEmail: 'riley@example.com',
      customerPhone: '(512) 555-0148',
      notes: 'Pet hair',
      dueDateYyyyMmDd: '2026-10-03',
      lineItems: [
        { id: 'line-1', name: 'Item', qty: '2', unitPrice: '140' },
        { id: 'line-2', name: 'Exterior', qty: '1', unitPrice: '70' },
      ],
    });
  });
});

describe('mapOpenedBill', () => {
  const bill = mapOpenedBill(
    {
      id: 'inv-9',
      status: 'sent',
      invoice_number: 1001,
      customer_name: '   ',
      customer_email: null,
      customer_phone: '5125550101',
      due_on: '2026-10-03',
      note: '  ',
      total_cents: 9900,
    },
    [
      {
        id: 'line-1',
        description: 'Full detail',
        quantity: 2,
        unit_amount_cents: 1000,
        amount_cents: 2500,
        position: 0,
      },
    ],
  );

  it('formats the bill from total cents and the stored line amount', () => {
    expect(bill).toMatchObject({
      presentation: 'bill',
      status: 'sent',
      number: 1001,
      customerName: '—',
      customerEmail: '',
      customerPhone: '(512) 555-0101',
      dueDateLabel: formatInvoiceDueDate('2026-10-03', 'long'),
      notes: '',
      amount: 99,
      lineItems: [{ name: 'Full detail', qty: 2, unitPrice: 10, amount: 25 }],
    });
  });

  it('prints total cents for subtotal and amount due, and calls a sent bill Unpaid', () => {
    expect(invoiceDocumentModel(bill)).toMatchObject({
      numberLabel: '#1001',
      statusLabel: 'Unpaid',
      subtotalLabel: '$99.00',
      taxValueLabel: null,
      showBalance: true,
      balanceTitle: 'Amount due',
      balanceLabel: '$99.00',
      showPaid: false,
      lineItems: [expect.objectContaining({ amountLabel: '$25.00', unitPriceLabel: '$10.00' })],
    });
  });

  it('shows stored tax on the bill and keeps amount due as the customer total', () => {
    const taxed = mapOpenedBill(
      {
        id: 'inv-tax',
        status: 'sent',
        invoice_number: 1008,
        customer_name: 'Alex',
        due_on: '2026-10-03',
        subtotal_cents: 8500,
        tax_cents: 191,
        tax_rate_bps: 225,
        total_cents: 8691,
      },
      [
        {
          id: 'line-1',
          description: 'Wash',
          quantity: 1,
          unit_amount_cents: 8500,
          amount_cents: 8500,
          position: 0,
        },
      ],
    );
    expect(invoiceDocumentModel(taxed)).toMatchObject({
      subtotalLabel: '$85.00',
      taxLabel: 'Tax (2.25%)',
      taxValueLabel: '$1.91',
      balanceLabel: '$86.91',
    });
  });

  it('labels paid and void bills from the same total', () => {
    const paid = invoiceDocumentModel({ ...bill, status: 'paid' });
    const voided = invoiceDocumentModel({ ...bill, status: 'void' });
    expect(paid).toMatchObject({
      statusLabel: 'Paid',
      showPaid: true,
      paidLabel: '$99.00',
      showBalance: false,
    });
    expect(voided).toMatchObject({
      statusLabel: 'Void',
      voidLabel: 'Void',
      voided: true,
      showPaid: false,
      showBalance: false,
    });
  });
});

describe('fetchInvoiceForOpen', () => {
  beforeEach(() => {
    supabase.from.mockReset();
  });

  it('loads a draft without amount_cents', async () => {
    const status = queryResult({ data: { status: 'draft' }, error: null });
    const invoice = queryResult({
      data: {
        id: 'inv-1',
        status: 'draft',
        customer_name: 'Riley',
        customer_email: null,
        customer_phone: null,
        note: null,
        due_on: null,
      },
      error: null,
    });
    const lines = queryResult({ data: [], error: null });
    supabase.from
      .mockReturnValueOnce(status)
      .mockReturnValueOnce(invoice)
      .mockReturnValueOnce(lines);

    const result = await fetchInvoiceForOpen('biz-1', 'inv-1');

    expect(status.select).toHaveBeenCalledWith('status');
    expect(status.eq).toHaveBeenCalledWith('id', 'inv-1');
    expect(status.eq).toHaveBeenCalledWith('business_id', 'biz-1');
    expect(invoice.select).toHaveBeenCalledWith(
      'id, status, customer_name, customer_email, customer_phone, note, due_on, booking_id',
    );
    expect(lines.select).toHaveBeenCalledWith(
      'id, position, description, quantity, unit_amount_cents',
    );
    expect(lines.order).toHaveBeenCalledWith('position', { ascending: true });
    expect(result.outcome).toBe('draft');
  });

  it('loads a bill with amount_cents and total_cents', async () => {
    const status = queryResult({ data: { status: 'paid' }, error: null });
    const invoice = queryResult({
      data: {
        id: 'inv-2',
        status: 'paid',
        invoice_number: 1004,
        customer_name: 'Alex',
        customer_email: 'alex@example.com',
        customer_phone: null,
        due_on: '2026-09-22',
        note: null,
        total_cents: 9500,
      },
      error: null,
    });
    const lines = queryResult({
      data: [
        {
          id: 'line-1',
          description: 'Wash',
          quantity: 1,
          unit_amount_cents: 9500,
          amount_cents: 9500,
          position: 0,
        },
      ],
      error: null,
    });
    supabase.from
      .mockReturnValueOnce(status)
      .mockReturnValueOnce(invoice)
      .mockReturnValueOnce(lines);

    const result = await fetchInvoiceForOpen('biz-1', 'inv-2');

    expect(invoice.select).toHaveBeenCalledWith(
      'id, status, invoice_number, customer_name, customer_email, customer_phone, due_on, note, subtotal_cents, tax_cents, tax_rate_bps, total_cents, short_code',
    );
    expect(lines.select).toHaveBeenCalledWith(
      'id, description, quantity, unit_amount_cents, amount_cents, position',
    );
    expect(result.outcome).toBe('bill');
    expect(result.invoice.number).toBe(1004);
  });

  it('leaves when the status row is missing', async () => {
    supabase.from.mockReturnValueOnce(queryResult({ data: null, error: null }));
    await expect(fetchInvoiceForOpen('biz-1', 'missing')).resolves.toEqual({ outcome: 'leave' });
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it('leaves when a bill has no invoice number', async () => {
    supabase.from
      .mockReturnValueOnce(queryResult({ data: { status: 'sent' }, error: null }))
      .mockReturnValueOnce(
        queryResult({
          data: {
            id: 'inv-3',
            status: 'sent',
            invoice_number: null,
            customer_name: 'Sam',
            total_cents: 100,
          },
          error: null,
        }),
      );
    await expect(fetchInvoiceForOpen('biz-1', 'inv-3')).resolves.toEqual({ outcome: 'leave' });
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  it('leaves when line items fail', async () => {
    supabase.from
      .mockReturnValueOnce(queryResult({ data: { status: 'void' }, error: null }))
      .mockReturnValueOnce(
        queryResult({
          data: {
            id: 'inv-4',
            status: 'void',
            invoice_number: 1008,
            customer_name: 'Sam',
            customer_email: null,
            customer_phone: null,
            due_on: null,
            note: null,
            total_cents: 100,
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(queryResult({ data: null, error: { message: 'fail' } }));
    await expect(fetchInvoiceForOpen('biz-1', 'inv-4')).resolves.toEqual({ outcome: 'leave' });
  });
});

jest.mock('../../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../../lib/supabase';
import { fetchInvoicesForBusiness, formatInvoiceDueDate, mapInvoiceRow } from '../invoices';

const LIST_SELECT = 'id, status, customer_name, total_cents, due_on, created_at, invoice_number';

function queryResult(result) {
  const resolved = Promise.resolve(result);
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => resolved),
  };
  return builder;
}

describe('mapInvoiceRow', () => {
  it('maps a sent invoice and drops sort-only and secret fields', () => {
    expect(
      mapInvoiceRow({
        id: 'inv-1',
        status: 'sent',
        customer_name: '  Riley Chen  ',
        total_cents: 28500,
        due_on: '2026-09-12',
        created_at: '2026-09-01T15:00:00Z',
        invoice_number: 1001,
        public_token: 'secret',
        short_code: 'abc',
      }),
    ).toEqual({
      id: 'inv-1',
      status: 'sent',
      customerName: 'Riley Chen',
      amount: 285,
      number: 1001,
      dateLabel: formatInvoiceDueDate('2026-09-12'),
    });
  });

  it('uses Untitled, an em dash, and no due date when those fields are blank', () => {
    expect(
      mapInvoiceRow({
        id: 'inv-2',
        status: 'draft',
        customer_name: '   ',
        total_cents: 0,
        due_on: null,
        invoice_number: null,
      }),
    ).toEqual({
      id: 'inv-2',
      status: 'draft',
      customerName: 'Untitled',
      amount: 0,
      number: null,
      dateLabel: 'No due date',
    });
  });

  it('parses the due date at local noon so the calendar day stays put', () => {
    const expected = new Date(2026, 8, 12, 12, 0, 0, 0).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    expect(formatInvoiceDueDate('2026-09-12')).toBe(expected);
    expect(formatInvoiceDueDate('2026-09-12T00:00:00.000Z')).toBe(expected);
    expect(formatInvoiceDueDate('2026-02-31')).toBe('No due date');
  });
});

describe('fetchInvoicesForBusiness', () => {
  beforeEach(() => {
    supabase.from.mockReset();
  });

  it('selects list columns for the shop, newest first', async () => {
    const builder = queryResult({
      data: [
        {
          id: 'inv-1',
          status: 'paid',
          customer_name: 'Alex',
          total_cents: 9500,
          due_on: '2026-09-22',
          created_at: '2026-09-22T12:00:00Z',
          invoice_number: 1002,
        },
      ],
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const result = await fetchInvoicesForBusiness('biz-1');

    expect(supabase.from).toHaveBeenCalledWith('invoices');
    expect(builder.select).toHaveBeenCalledWith(LIST_SELECT);
    expect(builder.eq).toHaveBeenCalledWith('business_id', 'biz-1');
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result.error).toBeNull();
    expect(result.data).toEqual([
      {
        id: 'inv-1',
        status: 'paid',
        customerName: 'Alex',
        amount: 95,
        number: 1002,
        dateLabel: formatInvoiceDueDate('2026-09-22'),
      },
    ]);
    expect(LIST_SELECT).not.toMatch(/public_token|short_code|invoice_line_items/);
  });

  it('treats an empty shop as an empty list', async () => {
    supabase.from.mockReturnValue(queryResult({ data: [], error: null }));
    await expect(fetchInvoicesForBusiness('biz-1')).resolves.toEqual({ data: [], error: null });
  });

  it('returns the supabase error without mapping rows', async () => {
    const error = { message: 'permission denied' };
    supabase.from.mockReturnValue(queryResult({ data: null, error }));
    await expect(fetchInvoicesForBusiness('biz-1')).resolves.toEqual({ data: null, error });
  });
});

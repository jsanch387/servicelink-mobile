jest.mock('../../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

import {
  patchInvoiceDraft,
  postInvoiceDraft,
  deleteInvoice,
  postMarkInvoicePaid,
  postSendInvoice,
  postVoidInvoice,
} from '../invoiceWrites';

const body = {
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  customerPhone: '5551234567',
  dueDate: '2026-10-15',
  note: '',
  lines: [{ description: 'Full detail', quantity: '1', amount: '150.00' }],
};

function jsonResponse(status, payload) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

describe('invoice writes', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('creates a draft with the user access token', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { success: true, invoiceId: 'inv-1' }));

    await expect(postInvoiceDraft('token-1', body)).resolves.toEqual({
      ok: true,
      invoiceId: 'inv-1',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/invoices',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
        body: JSON.stringify(body),
      }),
    );
  });

  it('updates a draft by id', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { success: true, invoiceId: 'inv-2' }));

    const result = await patchInvoiceDraft('token-1', 'inv-2', body);

    expect(result).toEqual({ ok: true, invoiceId: 'inv-2' });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/invoices/inv-2',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('sends and keeps the delivery fields', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(200, {
        success: true,
        invoiceId: 'inv-3',
        invoiceNumber: 1001,
        shortUrl: 'https://app.example.com/b/abc',
        emailAttempted: true,
        emailSent: false,
        emailError: 'Could not email this invoice.',
        smsAttempted: true,
        smsSent: true,
        smsError: null,
      }),
    );

    const result = await postSendInvoice('token-1', { ...body, invoiceId: 'inv-3' });

    expect(result).toMatchObject({
      ok: true,
      invoiceId: 'inv-3',
      invoiceNumber: 1001,
      emailSent: false,
      smsSent: true,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/invoices/send',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('surfaces the server message for a Pro gate', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(403, {
        success: false,
        error: 'Invoices are a Pro feature. Upgrade to Pro to send invoices.',
      }),
    );

    const result = await postSendInvoice('token-1', body);
    expect(result.ok).toBe(false);
    expect(result.error.message).toBe(
      'Invoices are a Pro feature. Upgrade to Pro to send invoices.',
    );
  });

  it('marks a sent invoice paid with the chosen method', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { success: true, invoiceId: 'inv-4' }));

    await expect(postMarkInvoicePaid('token-1', 'inv-4', 'cash')).resolves.toEqual({
      ok: true,
      invoiceId: 'inv-4',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/invoices/inv-4/paid',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
        body: JSON.stringify({ method: 'cash' }),
      }),
    );
  });

  it('rejects a card payment before calling the server', async () => {
    const result = await postMarkInvoicePaid('token-1', 'inv-4', 'card');
    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Choose how this was paid.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows the sent-only error from the server', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(409, { success: false, error: 'Only a sent invoice can be marked paid.' }),
    );

    const result = await postMarkInvoicePaid('token-1', 'inv-4', 'other');
    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Only a sent invoice can be marked paid.');
  });

  it('voids a sent invoice with no body', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { success: true, invoiceId: 'inv-5' }));

    await expect(postVoidInvoice('token-1', 'inv-5')).resolves.toEqual({
      ok: true,
      invoiceId: 'inv-5',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/invoices/inv-5/void',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
      }),
    );
    expect(global.fetch.mock.calls[0][1].body).toBeUndefined();
  });

  it('shows the void sent-only error from the server', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(409, { success: false, error: 'Only a sent invoice can be voided.' }),
    );

    const result = await postVoidInvoice('token-1', 'inv-5');
    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Only a sent invoice can be voided.');
  });

  it('deletes an invoice with no body', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { success: true, invoiceId: 'inv-6' }));

    await expect(deleteInvoice('token-1', 'inv-6')).resolves.toEqual({
      ok: true,
      invoiceId: 'inv-6',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/invoices/inv-6',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
      }),
    );
    expect(global.fetch.mock.calls[0][1].body).toBeUndefined();
    expect(global.fetch.mock.calls[0][1].headers['Content-Type']).toBeUndefined();
  });

  it('shows the delete error from the server', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(500, { success: false, error: 'Could not delete this invoice.' }),
    );

    const result = await deleteInvoice('token-1', 'inv-6');
    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Could not delete this invoice.');
  });

  it('asks the user to sign in again before deleting', async () => {
    global.fetch.mockResolvedValue(jsonResponse(401, { success: false }));

    const result = await deleteInvoice('token-1', 'inv-6');
    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Sign in again to delete this invoice.');
  });
});

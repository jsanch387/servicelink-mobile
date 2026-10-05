jest.mock('../../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

import { fetchInvoicePdf, invoicePdfFilename } from '../invoicePdf';

const PDF_BYTES = new TextEncoder().encode('%PDF-1.4 invoice');

function response({ status, bytes, json, headers = {} }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[String(name).toLowerCase()] ?? headers[name] ?? null },
    arrayBuffer: async () =>
      bytes
        ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        : new ArrayBuffer(0),
    json: async () => json,
  };
}

describe('invoice PDF', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('reads the filename from the download header', () => {
    expect(invoicePdfFilename('attachment; filename="Invoice-1001.pdf"')).toBe('Invoice-1001.pdf');
    expect(invoicePdfFilename(null)).toBe('Invoice.pdf');
  });

  it('downloads the bill with the user access token', async () => {
    global.fetch.mockResolvedValue(
      response({
        status: 200,
        bytes: PDF_BYTES,
        headers: { 'content-disposition': 'attachment; filename="Invoice-1001.pdf"' },
      }),
    );

    const result = await fetchInvoicePdf('token-1', 'inv-9');

    expect(result.ok).toBe(true);
    expect(result.filename).toBe('Invoice-1001.pdf');
    expect(Array.from(result.bytes.slice(0, 5))).toEqual(Array.from(PDF_BYTES.slice(0, 5)));
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/invoices/inv-9/pdf',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/pdf',
          Authorization: 'Bearer token-1',
        }),
      }),
    );
    expect(global.fetch.mock.calls[0][1].body).toBeUndefined();
  });

  it('shows the server error when the invoice cannot be downloaded', async () => {
    global.fetch.mockResolvedValue(
      response({
        status: 404,
        json: { success: false, error: 'Invoice not found.' },
      }),
    );

    const result = await fetchInvoicePdf('token-1', 'missing');

    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Invoice not found.');
  });

  it('asks the user to sign in again', async () => {
    global.fetch.mockResolvedValue(response({ status: 401, json: { success: false } }));

    const result = await fetchInvoicePdf('token-1', 'inv-9');

    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Sign in again to download this invoice.');
  });

  it('rejects a response that is not a PDF', async () => {
    global.fetch.mockResolvedValue(
      response({ status: 200, bytes: new TextEncoder().encode('<html></html>') }),
    );

    const result = await fetchInvoicePdf('token-1', 'inv-9');

    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('Could not download this invoice.');
  });
});

import { createEmptyInvoiceDraft } from '../createInvoiceDraft';
import { buildInvoiceWriteBody } from '../invoiceWriteBody';
import { describeInvoiceSendResult, invoiceSendConfirmationBody } from '../invoiceSendResult';

function readyDraft() {
  const draft = createEmptyInvoiceDraft();
  draft.customerName = '  Jane Doe  ';
  draft.customerEmail = 'Jane@Example.com';
  draft.customerPhone = '(555) 123-4567';
  draft.dueDateYyyyMmDd = '2026-10-15';
  draft.notes = '  Gate code  ';
  draft.bookingId = 'not-a-uuid';
  draft.lineItems = [
    { id: 'a', name: '  ', unitPrice: '', qty: '1' },
    { id: 'b', name: 'Full detail', unitPrice: '150', qty: '1' },
    { id: 'c', name: 'Mats', unitPrice: '20.5', qty: '2' },
  ];
  return draft;
}

describe('buildInvoiceWriteBody', () => {
  it('builds the save body in dollars and skips a blank line', () => {
    expect(buildInvoiceWriteBody(readyDraft())).toEqual({
      customerName: 'Jane Doe',
      customerEmail: 'Jane@Example.com',
      customerPhone: '5551234567',
      dueDate: '2026-10-15',
      note: 'Gate code',
      lines: [
        { description: 'Full detail', quantity: '1', amount: '150.00' },
        { description: 'Mats', quantity: '2', amount: '20.50' },
      ],
    });
  });

  it('adds invoiceId on send only when it is a uuid', () => {
    const draft = readyDraft();
    draft.bookingId = '00000000-0000-4000-8000-000000000001';
    expect(
      buildInvoiceWriteBody(draft, {
        includeInvoiceId: true,
        invoiceId: '00000000-0000-4000-8000-000000000002',
      }),
    ).toMatchObject({
      invoiceId: '00000000-0000-4000-8000-000000000002',
      bookingId: '00000000-0000-4000-8000-000000000001',
    });
    expect(
      buildInvoiceWriteBody(draft, { includeInvoiceId: true, invoiceId: 'local-1' }),
    ).not.toHaveProperty('invoiceId');
  });
});

describe('describeInvoiceSendResult', () => {
  it('treats a channel that was not attempted as success', () => {
    expect(
      describeInvoiceSendResult({
        emailAttempted: true,
        emailSent: true,
        smsAttempted: false,
        smsSent: false,
      }),
    ).toEqual({ kind: 'sent', message: 'Invoice sent.' });
  });

  it('warns when one channel fails and keeps the error from the other', () => {
    expect(
      describeInvoiceSendResult({
        emailAttempted: true,
        emailSent: true,
        smsAttempted: true,
        smsSent: false,
        smsError: 'This customer opted out of texts.',
      }),
    ).toEqual({
      kind: 'warning',
      message: 'Invoice emailed. This customer opted out of texts.',
    });
  });

  it('names the customer when the invoice was emailed', () => {
    expect(
      invoiceSendConfirmationBody(
        { emailSent: true, smsSent: false },
        { customerEmail: 'jane@example.com' },
      ),
    ).toBe("We've sent the invoice to jane@example.com.");
  });

  it('keeps a partial-delivery warning on the confirmation', () => {
    expect(
      invoiceSendConfirmationBody({
        emailAttempted: true,
        emailSent: true,
        smsAttempted: true,
        smsSent: false,
        smsError: 'This customer opted out of texts.',
      }),
    ).toBe('Invoice emailed. This customer opted out of texts.');
  });

  it('reports a failure when every attempted channel fails', () => {
    expect(
      describeInvoiceSendResult({
        emailAttempted: true,
        emailSent: false,
        emailError: 'Could not email this invoice.',
        smsAttempted: false,
        smsSent: false,
      }).kind,
    ).toBe('failed');
  });
});

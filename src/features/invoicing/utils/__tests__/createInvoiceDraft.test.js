import { CREATE_INVOICE_SOURCE } from '../../constants/createInvoiceWizard';
import {
  buildInvoiceFromDraft,
  canContinueInvoiceStep,
  canCreateInvoice,
  createEmptyInvoiceDraft,
  seedCreateInvoiceDraft,
} from '../createInvoiceDraft';
import { addDraftInvoice, getInvoiceCatalog, resetInvoiceCatalog } from '../invoiceCatalog';

function readyDraft() {
  const draft = createEmptyInvoiceDraft();
  draft.customerName = 'Riley Chen';
  draft.customerEmail = 'riley@example.com';
  draft.lineItems = [{ id: 'line-1', name: 'Full detail', qty: '1', unitPrice: '285' }];
  draft.dueDateYyyyMmDd = '2026-10-09';
  draft.notes = 'Parked out front.';
  return draft;
}

describe('createInvoiceDraft', () => {
  afterEach(() => {
    resetInvoiceCatalog();
  });

  it('seeds a later booking launch without opening that screen yet', () => {
    const draft = seedCreateInvoiceDraft({
      source: CREATE_INVOICE_SOURCE.BOOKING,
      bookingId: 'booking-1',
      customer: { name: 'Jordan Lee', email: 'jordan@example.com', phone: '5125550101' },
      lineItems: [{ name: 'Interior detail', qty: 1, unitPrice: 140 }],
    });

    expect(draft.source).toBe('booking');
    expect(draft.bookingId).toBe('booking-1');
    expect(draft.customerName).toBe('Jordan Lee');
    expect(draft.lineItems[0]).toMatchObject({
      name: 'Interior detail',
      qty: '1',
      unitPrice: '140',
    });
  });

  it('requires a name plus email or phone, then a due date and services', () => {
    const draft = createEmptyInvoiceDraft();
    expect(canCreateInvoice(draft)).toBe(false);

    draft.customerName = 'Alex Kim';
    expect(canContinueInvoiceStep('customer', draft)).toBe(false);

    draft.customerPhone = '(512) 555-0101';
    expect(canContinueInvoiceStep('customer', draft)).toBe(true);

    draft.customerPhone = '';
    draft.customerEmail = 'not-an-email';
    expect(canCreateInvoice(draft)).toBe(false);

    draft.customerEmail = 'alex@example.com';
    draft.customerPhone = '555';
    expect(canCreateInvoice(draft)).toBe(false);

    draft.customerPhone = '';
    expect(canContinueInvoiceStep('customer', draft)).toBe(true);
    expect(canContinueInvoiceStep('due', draft)).toBe(false);

    draft.dueDateYyyyMmDd = '2026-10-09';
    draft.lineItems = [{ id: 'line-1', name: 'Wash', qty: '1', unitPrice: '' }];
    expect(canContinueInvoiceStep('services', draft)).toBe(false);
    expect(canCreateInvoice(draft)).toBe(false);

    draft.lineItems = [{ id: 'line-1', name: 'Wash', qty: '', unitPrice: '15' }];
    expect(canContinueInvoiceStep('services', draft)).toBe(false);

    draft.lineItems = [{ id: 'line-1', name: 'Wash', qty: '1', unitPrice: '15' }];
    expect(canContinueInvoiceStep('services', draft)).toBe(true);
    expect(canCreateInvoice(draft)).toBe(true);

    draft.lineItems.push({ id: 'line-2', name: '', qty: '1', unitPrice: '15' });
    expect(canCreateInvoice(draft)).toBe(false);
  });

  it('builds a draft invoice and adds it to the list', () => {
    const before = getInvoiceCatalog().length;
    const invoice = buildInvoiceFromDraft(readyDraft(), { id: 'local-1', number: 'INV-1050' });

    expect(invoice).toMatchObject({
      status: 'draft',
      customerName: 'Riley Chen',
      amount: 285,
      serviceLabel: 'Full detail',
      dueDateLabel: 'October 9, 2026',
      source: 'invoices',
    });

    const saved = addDraftInvoice(readyDraft());
    expect(saved.number).toBe('INV-1050');
    expect(getInvoiceCatalog()).toHaveLength(before + 1);
    expect(getInvoiceCatalog()[0].id).toBe(saved.id);
  });
});

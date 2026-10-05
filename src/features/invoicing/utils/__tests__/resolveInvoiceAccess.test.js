import { INVOICE_EARLY_ACCESS_EMAILS } from '../../constants/invoiceFeatureFlags';
import { isInvoiceEarlyAccessEmail, resolveInvoiceAccess } from '../resolveInvoiceAccess';

describe('invoice rollout allowlist', () => {
  it('is limited to the prod test login', () => {
    expect(INVOICE_EARLY_ACCESS_EMAILS).toEqual(['jesuss387@gmail.com']);
    expect(isInvoiceEarlyAccessEmail('Jesuss387@gmail.com')).toBe(true);
    expect(isInvoiceEarlyAccessEmail('owner@example.com')).toBe(false);
  });

  it('hides invoices from every other account', () => {
    expect(
      resolveInvoiceAccess({
        email: 'owner@example.com',
        canSeeOffice: true,
        hasProAccess: true,
        profileLoaded: true,
      }),
    ).toEqual({ canSeeInvoices: false, isReady: true });
  });

  it('shows invoices to the allowlisted owner once Pro is loaded', () => {
    expect(
      resolveInvoiceAccess({
        email: 'jesuss387@gmail.com',
        canSeeOffice: true,
        hasProAccess: true,
        profileLoaded: true,
      }),
    ).toEqual({ canSeeInvoices: true, isReady: true });
  });

  it('waits for the owner profile before showing the row to the test login', () => {
    expect(
      resolveInvoiceAccess({
        email: 'jesuss387@gmail.com',
        canSeeOffice: true,
        hasProAccess: true,
        profileLoaded: false,
      }),
    ).toEqual({ canSeeInvoices: false, isReady: false });
  });

  it('opens to every owner with Pro when the allowlist is cleared', () => {
    expect(
      resolveInvoiceAccess({
        email: 'owner@example.com',
        canSeeOffice: true,
        hasProAccess: true,
        profileLoaded: true,
        restrictToEarlyAccess: false,
      }),
    ).toEqual({ canSeeInvoices: true, isReady: true });
  });
  it('keeps invoices off for the test login without Pro', () => {
    expect(
      resolveInvoiceAccess({
        email: 'jesuss387@gmail.com',
        canSeeOffice: true,
        hasProAccess: false,
        profileLoaded: true,
      }),
    ).toEqual({ canSeeInvoices: false, isReady: true });
  });
});

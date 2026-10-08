import { INVOICE_EARLY_ACCESS_EMAILS } from '../../constants/invoiceFeatureFlags';
import { isInvoiceEarlyAccessEmail, resolveInvoiceAccess } from '../resolveInvoiceAccess';

const hidden = { canSeeInvoices: false, canUseInvoices: false, showUpsell: false };

describe('invoice rollout allowlist', () => {
  it('is open to every owner with Pro', () => {
    expect(INVOICE_EARLY_ACCESS_EMAILS).toEqual([]);
  });

  it('matches nobody while the allowlist is empty', () => {
    expect(isInvoiceEarlyAccessEmail('jesuss387@gmail.com')).toBe(false);
    expect(isInvoiceEarlyAccessEmail('owner@example.com')).toBe(false);
  });
});

describe('resolveInvoiceAccess', () => {
  it('shows invoices to any owner with Pro', () => {
    expect(
      resolveInvoiceAccess({
        email: 'owner@example.com',
        canSeeOffice: true,
        hasProAccess: true,
        profileLoaded: true,
      }),
    ).toEqual({ canSeeInvoices: true, canUseInvoices: true, showUpsell: false, isReady: true });
  });

  it('shows the subscribe card to an owner without Pro', () => {
    expect(
      resolveInvoiceAccess({
        email: 'owner@example.com',
        canSeeOffice: true,
        hasProAccess: false,
        profileLoaded: true,
      }),
    ).toEqual({ canSeeInvoices: true, canUseInvoices: false, showUpsell: true, isReady: true });
  });

  it('does not special-case the former early-access login', () => {
    expect(
      resolveInvoiceAccess({
        email: 'jesuss387@gmail.com',
        canSeeOffice: true,
        hasProAccess: true,
        profileLoaded: true,
      }),
    ).toEqual({ canSeeInvoices: true, canUseInvoices: true, showUpsell: false, isReady: true });
  });

  it('waits for the owner profile before showing invoices', () => {
    expect(
      resolveInvoiceAccess({
        email: 'owner@example.com',
        canSeeOffice: true,
        hasProAccess: true,
        profileLoaded: false,
      }),
    ).toEqual({ ...hidden, isReady: false });
  });

  it('hides invoices from everyone else while the allowlist is on', () => {
    expect(
      resolveInvoiceAccess({
        email: 'owner@example.com',
        canSeeOffice: true,
        hasProAccess: true,
        profileLoaded: true,
        restrictToEarlyAccess: true,
      }),
    ).toEqual({ ...hidden, isReady: true });
  });

  it('keeps invoices off for shop members', () => {
    expect(
      resolveInvoiceAccess({
        email: 'owner@example.com',
        canSeeOffice: false,
        hasProAccess: true,
        profileLoaded: true,
      }),
    ).toEqual({ ...hidden, isReady: true });
  });
});

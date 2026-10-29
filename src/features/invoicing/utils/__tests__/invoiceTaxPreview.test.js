import { previewInvoiceTax } from '../invoiceTaxPreview';

describe('previewInvoiceTax', () => {
  it('previews $85 at 2.25% as $1.91 tax', () => {
    expect(
      previewInvoiceTax({
        subtotalCents: 8500,
        shopTaxEnabled: true,
        shopTaxRateBps: 225,
      }),
    ).toEqual({
      taxCents: 191,
      taxRateBps: 225,
      label: 'Tax (2.25%)',
      totalCents: 8691,
    });
  });

  it('adds no tax when the shop switch is off', () => {
    expect(
      previewInvoiceTax({
        subtotalCents: 8500,
        shopTaxEnabled: false,
        shopTaxRateBps: 225,
      }),
    ).toMatchObject({ taxCents: 0, totalCents: 8500 });
  });

  it('keeps a booking invoice untaxed when that appointment stored no tax', () => {
    expect(
      previewInvoiceTax({
        subtotalCents: 8500,
        shopTaxEnabled: true,
        shopTaxRateBps: 825,
        bookingPayment: { found: true, taxCents: 0, taxRateBps: 825 },
      }),
    ).toMatchObject({ taxCents: 0, totalCents: 8500 });
  });

  it('uses the appointment rate when that job stored tax', () => {
    expect(
      previewInvoiceTax({
        subtotalCents: 8500,
        shopTaxEnabled: false,
        shopTaxRateBps: null,
        bookingPayment: { found: true, taxCents: 191, taxRateBps: 225 },
      }),
    ).toMatchObject({ taxCents: 191, taxRateBps: 225, totalCents: 8691, label: 'Tax (2.25%)' });
  });
});

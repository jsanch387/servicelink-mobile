import {
  buildTaxSettingsPatch,
  formatTaxLineLabel,
  isSaveableTaxRate,
  percentStringToTaxRateBps,
  previewTaxCents,
  sanitizeTaxPercentInput,
  taxRateBpsToPercentString,
} from '../utils/taxRateModel';

describe('sanitizeTaxPercentInput', () => {
  it('keeps two decimal places and clamps above 25', () => {
    expect(sanitizeTaxPercentInput('8.259')).toBe('8.25');
    expect(sanitizeTaxPercentInput('26')).toBe('25');
    expect(sanitizeTaxPercentInput('25.01')).toBe('25');
    expect(sanitizeTaxPercentInput('25.00')).toBe('25.00');
  });
});

describe('percentStringToTaxRateBps', () => {
  it('rounds a percent to basis points', () => {
    expect(percentStringToTaxRateBps('8.25')).toBe(825);
    expect(percentStringToTaxRateBps('2.25')).toBe(225);
    expect(percentStringToTaxRateBps('0.01')).toBe(1);
    expect(percentStringToTaxRateBps('25')).toBe(2500);
  });

  it('rejects empty, zero, and rates above 25%', () => {
    expect(percentStringToTaxRateBps('')).toBeNull();
    expect(percentStringToTaxRateBps('0')).toBeNull();
    expect(percentStringToTaxRateBps('0.00')).toBeNull();
    expect(percentStringToTaxRateBps('25.01')).toBeNull();
    expect(isSaveableTaxRate('0')).toBe(false);
    expect(isSaveableTaxRate('8.25')).toBe(true);
  });
});

describe('taxRateBpsToPercentString', () => {
  it('shows basis points as a two-decimal percent', () => {
    expect(taxRateBpsToPercentString(825)).toBe('8.25');
    expect(taxRateBpsToPercentString(225)).toBe('2.25');
    expect(taxRateBpsToPercentString(1)).toBe('0.01');
    expect(taxRateBpsToPercentString(0)).toBe('');
    expect(taxRateBpsToPercentString(null)).toBe('');
  });
});

describe('previewTaxCents', () => {
  it('adds tax once on the price after discount', () => {
    expect(previewTaxCents(8500, 225)).toBe(191);
    expect(8500 + previewTaxCents(8500, 225)).toBe(8691);
  });

  it('does not tax a zero price or a missing rate', () => {
    expect(previewTaxCents(0, 225)).toBe(0);
    expect(previewTaxCents(8500, 0)).toBe(0);
    expect(previewTaxCents(8500, null)).toBe(0);
  });
});

describe('formatTaxLineLabel', () => {
  it('labels the rate from basis points', () => {
    expect(formatTaxLineLabel(225)).toBe('Tax (2.25%)');
    expect(formatTaxLineLabel(800)).toBe('Tax (8%)');
    expect(formatTaxLineLabel(null)).toBe('Tax');
  });
});

describe('buildTaxSettingsPatch', () => {
  it('turns tax on at the typed rate', () => {
    expect(buildTaxSettingsPatch({ collectTax: true, taxRate: '8.25' })).toEqual({
      fields: { tax_enabled: true, tax_rate_bps: 825 },
      error: null,
    });
  });

  it('changes the rate while tax stays on', () => {
    expect(buildTaxSettingsPatch({ collectTax: true, taxRate: '2.25' }).fields).toEqual({
      tax_enabled: true,
      tax_rate_bps: 225,
    });
  });

  it('turns tax off without sending a new rate', () => {
    expect(buildTaxSettingsPatch({ collectTax: false, taxRate: '8.25' })).toEqual({
      fields: { tax_enabled: false },
      error: null,
    });
  });

  it('leaves tax columns alone when the form did not include them', () => {
    expect(buildTaxSettingsPatch({}).fields).toEqual({});
  });

  it('refuses to turn tax on at 0', () => {
    const out = buildTaxSettingsPatch({ collectTax: true, taxRate: '0' });
    expect(out.error?.message).toMatch(/0\.01%/);
    expect(out.fields).toEqual({});
  });
});

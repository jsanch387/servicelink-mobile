import {
  canonicalNanpDigits,
  formatPhoneInputAsYouType,
  getPhoneInputValidationMessage,
  isValidUsNanpTenDigits,
  normalizePhoneForDatabase,
  phoneForSmsUri,
} from '../phone';

describe('isValidUsNanpTenDigits', () => {
  it('accepts valid NANP NXX–NXX', () => {
    expect(isValidUsNanpTenDigits('2125551234')).toBe(true);
    expect(isValidUsNanpTenDigits('4158675309')).toBe(true);
  });

  it('rejects invalid leading area or exchange digit', () => {
    expect(isValidUsNanpTenDigits('0125551234')).toBe(false);
    expect(isValidUsNanpTenDigits('5551234567')).toBe(false);
    expect(isValidUsNanpTenDigits('2121555123')).toBe(false);
  });
});

describe('normalizePhoneForDatabase', () => {
  it('returns 10 digits for valid formatted input', () => {
    expect(normalizePhoneForDatabase('(212) 555-1234')).toBe('2125551234');
  });

  it('returns null for invalid 10-digit patterns', () => {
    expect(normalizePhoneForDatabase('(111) 111-1111')).toBe(null);
    expect(normalizePhoneForDatabase('1111111111')).toBe(null);
  });

  it('returns null for incomplete input', () => {
    expect(normalizePhoneForDatabase('(212) 555')).toBe(null);
  });
});

describe('getPhoneInputValidationMessage', () => {
  it('allows empty', () => {
    expect(getPhoneInputValidationMessage('')).toBe(null);
    expect(getPhoneInputValidationMessage('  ')).toBe(null);
  });

  it('flags incomplete numbers', () => {
    expect(getPhoneInputValidationMessage('(212) 555')).not.toBe(null);
  });

  it('flags invalid complete numbers', () => {
    expect(getPhoneInputValidationMessage('(555) 123-4567')).not.toBe(null);
  });
});

describe('formatPhoneInputAsYouType', () => {
  it('formats progressive valid entry', () => {
    expect(formatPhoneInputAsYouType('2')).toBe('(2');
    expect(formatPhoneInputAsYouType('212')).toBe('(212');
    expect(formatPhoneInputAsYouType('2125551234')).toBe('(212) 555-1234');
  });

  it('strips invalid leading digits so the area code can start with 2–9', () => {
    expect(formatPhoneInputAsYouType('0123')).toBe('(23');
  });
});

describe('phoneForSmsUri', () => {
  it('returns E.164 for valid 10-digit US', () => {
    expect(phoneForSmsUri('2125551234')).toBe('+12125551234');
  });

  it('returns null for invalid 10-digit US', () => {
    expect(phoneForSmsUri('1111111111')).toBe(null);
  });
});

describe('canonicalNanpDigits', () => {
  it('strips leading 1 on 11-digit input', () => {
    expect(canonicalNanpDigits('+1 (212) 555-1234')).toBe('2125551234');
  });
});

import {
  formatPhoneForDisplay,
  formatPhoneInputAsYouType,
  normalizePhoneForDatabase,
  US_NANP_FORMATTED_MAX_LENGTH,
} from '../../../utils/phone';

describe('normalizePhoneForDatabase', () => {
  it('strips formatting and stores 10 NANP digits only', () => {
    expect(normalizePhoneForDatabase('(555) 234-5678')).toBe('5552345678');
    expect(normalizePhoneForDatabase('5552345678')).toBe('5552345678');
    expect(normalizePhoneForDatabase('+15552345678')).toBe('5552345678');
    expect(normalizePhoneForDatabase('15552345678')).toBe('5552345678');
  });

  it('returns null when empty or incomplete', () => {
    expect(normalizePhoneForDatabase('')).toBe(null);
    expect(normalizePhoneForDatabase('   ')).toBe(null);
    expect(normalizePhoneForDatabase('555')).toBe(null);
  });
});

describe('formatPhoneInputAsYouType', () => {
  it('builds partial NANP as user types', () => {
    expect(formatPhoneInputAsYouType('5')).toBe('(5');
    expect(formatPhoneInputAsYouType('555')).toBe('(555');
    expect(formatPhoneInputAsYouType('5552')).toBe('(555) 2');
    expect(formatPhoneInputAsYouType('5552345678')).toBe('(555) 234-5678');
  });

  it('strips leading 1 and caps at 10 national digits', () => {
    expect(formatPhoneInputAsYouType('15552345678')).toBe('(555) 234-5678');
    expect(formatPhoneInputAsYouType('5123214324')).toBe('(512) 321-4324');
  });

  it('does not grow past 10 national digits', () => {
    const full = formatPhoneInputAsYouType('5123214324');
    expect(full).toBe('(512) 321-4324');
    expect(full.length).toBe(US_NANP_FORMATTED_MAX_LENGTH);
    expect(formatPhoneInputAsYouType('55523456789999')).toBe('(555) 234-5678');
  });

  it('clears to empty when digits removed', () => {
    expect(formatPhoneInputAsYouType('')).toBe('');
  });
});

describe('formatPhoneForDisplay', () => {
  it('returns empty for null, undefined, or blank', () => {
    expect(formatPhoneForDisplay(null)).toBe('');
    expect(formatPhoneForDisplay(undefined)).toBe('');
    expect(formatPhoneForDisplay('   ')).toBe('');
  });

  it('formats 10-digit US numbers (no +1 in label)', () => {
    expect(formatPhoneForDisplay('5552345678')).toBe('(555) 234-5678');
    expect(formatPhoneForDisplay('(555) 234-5678')).toBe('(555) 234-5678');
    expect(formatPhoneForDisplay('555-234-5678')).toBe('(555) 234-5678');
  });

  it('normalizes 11-digit with country code 1 to the same display', () => {
    expect(formatPhoneForDisplay('15552345678')).toBe('(555) 234-5678');
    expect(formatPhoneForDisplay('+1 555 234 5678')).toBe('(555) 234-5678');
  });

  it('uses +digits fallback for non-US lengths', () => {
    expect(formatPhoneForDisplay('+44 20 7123 4567')).toMatch(/^\+/);
    expect(formatPhoneForDisplay('+442071234567')).toBe('+442071234567');
  });
});

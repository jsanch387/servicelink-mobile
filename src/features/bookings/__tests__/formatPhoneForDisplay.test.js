import {
  formatPhoneForDisplay,
  formatPhoneInputAsYouType,
  normalizePhoneForDatabase,
  US_NANP_FORMATTED_MAX_LENGTH,
} from '../../../utils/phone';

describe('normalizePhoneForDatabase', () => {
  it('strips formatting and stores 10 NANP digits only', () => {
    expect(normalizePhoneForDatabase('(555) 123-4567')).toBe('5551234567');
    expect(normalizePhoneForDatabase('5551234567')).toBe('5551234567');
    expect(normalizePhoneForDatabase('+15551234567')).toBe('5551234567');
    expect(normalizePhoneForDatabase('15551234567')).toBe('5551234567');
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
    expect(formatPhoneInputAsYouType('5551')).toBe('(555) 1');
    expect(formatPhoneInputAsYouType('5551234567')).toBe('(555) 123-4567');
  });

  it('strips leading 1 and caps at 10 national digits', () => {
    expect(formatPhoneInputAsYouType('15551234567')).toBe('(555) 123-4567');
    expect(formatPhoneInputAsYouType('5123214324')).toBe('(512) 321-4324');
  });

  it('does not grow past 10 national digits', () => {
    const full = formatPhoneInputAsYouType('5123214324');
    expect(full).toBe('(512) 321-4324');
    expect(full.length).toBe(US_NANP_FORMATTED_MAX_LENGTH);
    expect(formatPhoneInputAsYouType('55512345678999')).toBe('(555) 123-4567');
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
    expect(formatPhoneForDisplay('5551234567')).toBe('(555) 123-4567');
    expect(formatPhoneForDisplay('(555) 123-4567')).toBe('(555) 123-4567');
    expect(formatPhoneForDisplay('555-123-4567')).toBe('(555) 123-4567');
  });

  it('normalizes 11-digit with country code 1 to the same display', () => {
    expect(formatPhoneForDisplay('15551234567')).toBe('(555) 123-4567');
    expect(formatPhoneForDisplay('+1 555 123 4567')).toBe('(555) 123-4567');
  });

  it('uses +digits fallback for non-US lengths', () => {
    expect(formatPhoneForDisplay('+44 20 7123 4567')).toMatch(/^\+/);
    expect(formatPhoneForDisplay('+442071234567')).toBe('+442071234567');
  });
});

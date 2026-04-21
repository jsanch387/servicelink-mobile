import { formatPhoneForDisplay } from '../utils/formatPhoneForDisplay';

describe('formatPhoneForDisplay', () => {
  it('returns empty for null, undefined, or blank', () => {
    expect(formatPhoneForDisplay(null)).toBe('');
    expect(formatPhoneForDisplay(undefined)).toBe('');
    expect(formatPhoneForDisplay('   ')).toBe('');
  });

  it('formats 10-digit US numbers', () => {
    expect(formatPhoneForDisplay('5551234567')).toBe('(555) 123-4567');
    expect(formatPhoneForDisplay('(555) 123-4567')).toBe('(555) 123-4567');
    expect(formatPhoneForDisplay('555-123-4567')).toBe('(555) 123-4567');
  });

  it('formats 11-digit US numbers with country code 1', () => {
    expect(formatPhoneForDisplay('15551234567')).toBe('+1 (555) 123-4567');
    expect(formatPhoneForDisplay('+1 555 123 4567')).toBe('+1 (555) 123-4567');
  });

  it('uses +digits fallback for other lengths', () => {
    expect(formatPhoneForDisplay('+44 20 7123 4567')).toMatch(/^\+/);
    expect(formatPhoneForDisplay('+442071234567')).toBe('+442071234567');
  });
});

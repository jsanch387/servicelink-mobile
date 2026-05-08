import { isValidEmailFormat, normalizeEmailForDedupe } from '../email';

describe('normalizeEmailForDedupe', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmailForDedupe('  Hello@EXAMPLE.com  ')).toBe('hello@example.com');
  });

  it('returns null for empty', () => {
    expect(normalizeEmailForDedupe('')).toBeNull();
    expect(normalizeEmailForDedupe('   ')).toBeNull();
    expect(normalizeEmailForDedupe(null)).toBeNull();
  });
});

describe('isValidEmailFormat', () => {
  it('accepts typical addresses', () => {
    expect(isValidEmailFormat('a@b.co')).toBe(true);
    expect(isValidEmailFormat('  user@example.com ')).toBe(true);
  });

  it('rejects empty and malformed', () => {
    expect(isValidEmailFormat('')).toBe(false);
    expect(isValidEmailFormat('   ')).toBe(false);
    expect(isValidEmailFormat('not-an-email')).toBe(false);
    expect(isValidEmailFormat('missing@domain')).toBe(false);
  });
});

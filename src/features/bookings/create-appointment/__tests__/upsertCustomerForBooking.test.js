import { normalizeEmailForDedupe } from '../api/upsertCustomerForBooking';

describe('upsertCustomerForBooking helpers', () => {
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
});

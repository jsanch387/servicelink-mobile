import { maskPhoneForDisplay } from '../phone';

describe('maskPhoneForDisplay', () => {
  it('masks US NANP numbers to area code and last four', () => {
    expect(maskPhoneForDisplay('5552345678')).toBe('(555) ***-5678');
    expect(maskPhoneForDisplay('(555) 234-5678')).toBe('(555) ***-5678');
    expect(maskPhoneForDisplay('+15552345678')).toBe('(555) ***-5678');
  });
});

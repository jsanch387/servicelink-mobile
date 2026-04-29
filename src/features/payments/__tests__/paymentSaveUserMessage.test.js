import {
  getPaymentSaveUserMessage,
  normalizePaymentSaveErrorMessage,
} from '../utils/paymentSaveUserMessage';

describe('normalizePaymentSaveErrorMessage', () => {
  it('handles strings and Error objects', () => {
    expect(normalizePaymentSaveErrorMessage('  x  ')).toBe('x');
    expect(normalizePaymentSaveErrorMessage(new Error('oops'))).toBe('oops');
  });
});

describe('getPaymentSaveUserMessage', () => {
  it('maps missing settings row copy', () => {
    expect(
      getPaymentSaveUserMessage(
        new Error(
          'No payment settings row to update. Turn on ServiceLink checkout on the web first.',
        ),
      ),
    ).toMatch(/web first/);
  });

  it('maps network-ish failures', () => {
    expect(getPaymentSaveUserMessage(new Error('Network request failed'))).toMatch(/connection/i);
  });

  it('maps permission / RLS style failures', () => {
    expect(getPaymentSaveUserMessage(new Error('RLS denied'))).toMatch(/support/i);
  });

  it('uses generic fallback', () => {
    expect(getPaymentSaveUserMessage(new Error('Some cryptic code 0xDEAD'))).toMatch(/try again/i);
  });
});

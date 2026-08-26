import {
  CREATE_PAYMENT_NOTE_MAX_LENGTH,
  formatCreatePaymentDollars,
  hasCreatePaymentNote,
  parseCreatePaymentAmount,
  sanitizeCreatePaymentAmountInput,
  sanitizeCreatePaymentNote,
} from '../create-payment/utils/createPaymentAmount';
import { buildCreatePaymentLinkPreviewUrl } from '../create-payment/utils/createPaymentLinkPreview';

describe('parseCreatePaymentAmount', () => {
  it('parses a positive dollar amount', () => {
    expect(parseCreatePaymentAmount('85')).toBe(85);
    expect(parseCreatePaymentAmount('85.50')).toBe(85.5);
  });

  it('rejects empty, zero, or below Stripe’s $0.50 minimum', () => {
    expect(parseCreatePaymentAmount('')).toBeNull();
    expect(parseCreatePaymentAmount('0')).toBeNull();
    expect(parseCreatePaymentAmount('0.49')).toBeNull();
    expect(parseCreatePaymentAmount('0.50')).toBe(0.5);
  });

  it('rejects amounts over the on-screen cap', () => {
    expect(parseCreatePaymentAmount('10000')).toBeNull();
  });
});

describe('sanitizeCreatePaymentAmountInput', () => {
  it('caps whole dollars at four digits', () => {
    expect(sanitizeCreatePaymentAmountInput('12345')).toBe('1234');
    expect(sanitizeCreatePaymentAmountInput('1234.56')).toBe('1234.56');
    expect(sanitizeCreatePaymentAmountInput('12345.67')).toBe('1234.67');
  });
});

describe('hasCreatePaymentNote', () => {
  it('requires a non-empty note', () => {
    expect(hasCreatePaymentNote('')).toBe(false);
    expect(hasCreatePaymentNote('   ')).toBe(false);
    expect(hasCreatePaymentNote('Lights')).toBe(true);
  });
});

describe('sanitizeCreatePaymentNote', () => {
  it('trims and caps at the server max', () => {
    expect(sanitizeCreatePaymentNote('  Lights  ')).toBe('Lights');
    expect(sanitizeCreatePaymentNote('x'.repeat(CREATE_PAYMENT_NOTE_MAX_LENGTH + 20))).toHaveLength(
      CREATE_PAYMENT_NOTE_MAX_LENGTH,
    );
  });
});

describe('formatCreatePaymentDollars', () => {
  it('omits .00 when the amount is whole dollars', () => {
    expect(formatCreatePaymentDollars(85)).toBe('$85');
    expect(formatCreatePaymentDollars(250)).toBe('$250');
  });

  it('shows cents only when they are not zero', () => {
    expect(formatCreatePaymentDollars(85.5)).toBe('$85.50');
    expect(formatCreatePaymentDollars(0.5)).toBe('$0.50');
  });
});

describe('buildCreatePaymentLinkPreviewUrl', () => {
  it('includes amount and note on the pay path', () => {
    const url = buildCreatePaymentLinkPreviewUrl({ amount: 40, note: 'Lights' });
    expect(url).toContain('/pay?');
    expect(url).toContain('amount=40.00');
    expect(url).toContain('for=Lights');
  });
});

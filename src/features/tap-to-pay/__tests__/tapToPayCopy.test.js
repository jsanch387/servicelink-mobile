import {
  formatTapToPayErrorStatusLine,
  resolveTapToPaySheetCopy,
  TAP_TO_PAY_PAYMENT_NOT_COMPLETED,
  TAP_TO_PAY_SOMETHING_WENT_WRONG,
} from '../constants/tapToPayCopy';

describe('formatTapToPayErrorStatusLine', () => {
  it('keeps already-short messages', () => {
    expect(formatTapToPayErrorStatusLine('Nothing to collect.')).toBe('Nothing to collect');
  });

  it('maps server setup failures before collection', () => {
    expect(
      formatTapToPayErrorStatusLine(
        'Couldn’t start Tap to Pay. Try again or mark as paid.',
        'intent',
      ),
    ).toBe(TAP_TO_PAY_SOMETHING_WENT_WRONG);
    expect(
      formatTapToPayErrorStatusLine('Set up Stripe payments to use Tap to Pay.', 'intent'),
    ).toBe('Payments not set up');
  });

  it('maps collection failures after a payment attempt', () => {
    expect(formatTapToPayErrorStatusLine('Payment was declined.', 'collection')).toBe(
      'Payment declined',
    );
    expect(
      formatTapToPayErrorStatusLine('Payment failed. Try again or mark as paid.', 'collection'),
    ).toBe(TAP_TO_PAY_PAYMENT_NOT_COMPLETED);
  });

  it('uses context-specific fallbacks', () => {
    expect(formatTapToPayErrorStatusLine(null, 'intent')).toBe(TAP_TO_PAY_SOMETHING_WENT_WRONG);
    expect(formatTapToPayErrorStatusLine(null, 'collection')).toBe(
      TAP_TO_PAY_PAYMENT_NOT_COMPLETED,
    );
    expect(
      formatTapToPayErrorStatusLine(
        'Unexpected upstream failure from the payments service.',
        'intent',
      ),
    ).toBe(TAP_TO_PAY_SOMETHING_WENT_WRONG);
  });
});

describe('resolveTapToPaySheetCopy', () => {
  it('shows setup messaging for intent failures', () => {
    const copy = resolveTapToPaySheetCopy(
      'intent_error',
      25,
      'Set up Stripe payments to use Tap to Pay.',
    );

    expect(copy.title).toBe('Tap to Pay');
    expect(copy.hint).toBe('Set up Stripe payments to use Tap to Pay.');
    expect(copy.statusLine).toBe('Payments not set up');
  });

  it('shows payment messaging only after collection fails', () => {
    const copy = resolveTapToPaySheetCopy('error', 25, 'Payment was declined.');

    expect(copy.title).toBe(TAP_TO_PAY_PAYMENT_NOT_COMPLETED);
    expect(copy.statusLine).toBe('Payment declined');
  });

  it('shows ready-to-pay messaging while listening for a card', () => {
    const copy = resolveTapToPaySheetCopy('pending', 25, null);

    expect(copy.hint).toBe('Hold their card or phone near the top of your iPhone.');
    expect(copy.statusLine).toBe('Ready to accept payment');
  });

  it('does not label server intent failures as payment failed', () => {
    const copy = resolveTapToPaySheetCopy(
      'intent_error',
      25,
      'Couldn’t start Tap to Pay. Try again or mark as paid.',
    );

    expect(copy.statusLine).toBe(TAP_TO_PAY_SOMETHING_WENT_WRONG);
    expect(copy.statusLine).not.toMatch(/payment failed/i);
  });
});

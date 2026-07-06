import {
  formatTapToPayErrorHint,
  formatTapToPayErrorStatusLine,
  isTapToPayCanceledTerminalError,
  isTapToPayTimeoutTerminalError,
  resolveTapToPaySheetCopy,
  TAP_TO_PAY_ERROR_RETRY_HINT,
  TAP_TO_PAY_IOS_UPDATE_REQUIRED,
  TAP_TO_PAY_IOS_UPDATE_REQUIRED_STATUS,
  TAP_TO_PAY_PAYMENT_NOT_COMPLETED,
  TAP_TO_PAY_PAYMENT_TIMED_OUT,
  TAP_TO_PAY_PAYMENT_TIMED_OUT_STATUS,
  TAP_TO_PAY_PAYMENT_TIMED_OUT_TITLE,
  TAP_TO_PAY_PREPARING_WARM,
  TAP_TO_PAY_SETUP_NOT_FINISHED_TITLE,
  TAP_TO_PAY_SOMETHING_WENT_WRONG,
} from '../constants/tapToPayCopy';

describe('isTapToPayCanceledTerminalError', () => {
  it('detects cancel codes and messages', () => {
    expect(isTapToPayCanceledTerminalError('CANCELED', null)).toBe(true);
    expect(isTapToPayCanceledTerminalError(null, 'Payment was canceled.')).toBe(true);
    expect(isTapToPayCanceledTerminalError('DECLINED', 'Payment was declined.')).toBe(false);
  });
});

describe('isTapToPayTimeoutTerminalError', () => {
  it('detects timeout codes and messages', () => {
    expect(isTapToPayTimeoutTerminalError('TIMEOUT', null)).toBe(true);
    expect(isTapToPayTimeoutTerminalError('READER_BUSY', null)).toBe(true);
    expect(isTapToPayTimeoutTerminalError(null, 'Reader timed out waiting for card.')).toBe(true);
    expect(isTapToPayCanceledTerminalError('CANCELED', null)).toBe(true);
  });
});

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
    expect(formatTapToPayErrorStatusLine(TAP_TO_PAY_PAYMENT_TIMED_OUT, 'collection')).toBe(
      TAP_TO_PAY_PAYMENT_TIMED_OUT_STATUS,
    );
    expect(formatTapToPayErrorStatusLine('Reader timed out waiting for card.', 'collection')).toBe(
      TAP_TO_PAY_PAYMENT_TIMED_OUT_STATUS,
    );
  });

  it('maps iOS update required terminal failures', () => {
    expect(formatTapToPayErrorStatusLine(TAP_TO_PAY_IOS_UPDATE_REQUIRED, 'collection')).toBe(
      TAP_TO_PAY_IOS_UPDATE_REQUIRED_STATUS,
    );
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

  it('hides raw Stripe Apple link errors on collection failure', () => {
    const copy = resolveTapToPaySheetCopy('error', 25, "Tap to Pay setup wasn't finished.");

    expect(copy.title).toBe(TAP_TO_PAY_SETUP_NOT_FINISHED_TITLE);
    expect(copy.statusLine).toBe('Setup not finished');
    expect(copy.hint).toBe(TAP_TO_PAY_ERROR_RETRY_HINT);
    expect(copy.hint).not.toMatch(/apple id/i);
  });

  it('formats friendly hints for canceled payments', () => {
    expect(formatTapToPayErrorHint('Payment was canceled.', 'collection')).toBe(
      TAP_TO_PAY_ERROR_RETRY_HINT,
    );
    expect(formatTapToPayErrorStatusLine('Payment was canceled.', 'collection')).toBe(
      'Payment canceled',
    );
  });

  it('formats timeout outcomes on the collection sheet', () => {
    const copy = resolveTapToPaySheetCopy('error', 25, TAP_TO_PAY_PAYMENT_TIMED_OUT);

    expect(copy.title).toBe(TAP_TO_PAY_PAYMENT_TIMED_OUT_TITLE);
    expect(copy.statusLine).toBe(TAP_TO_PAY_PAYMENT_TIMED_OUT_STATUS);
    expect(copy.hint).toBe(TAP_TO_PAY_ERROR_RETRY_HINT);
  });

  it('shows honest setup messaging while Terminal is preparing', () => {
    const cold = resolveTapToPaySheetCopy('preparing', 25, null, { readerWasWarm: false });
    expect(cold.hint).toBe(
      'Apple will show the contactless reader on your iPhone when it is ready.',
    );
    expect(cold.statusLine).toBe('Setting up Tap to Pay');

    const warm = resolveTapToPaySheetCopy('preparing', 25, null, { readerWasWarm: true });
    expect(warm.statusLine).toBe('Opening Tap to Pay');
  });

  it('shows preparing payment while intent loads', () => {
    const copy = resolveTapToPaySheetCopy('loading_intent', 25, null, { readerWasWarm: true });
    expect(copy.statusLine).toBe(TAP_TO_PAY_PREPARING_WARM);
  });

  it('shows processing messaging after card read', () => {
    const copy = resolveTapToPaySheetCopy('processing', 25, null);
    expect(copy.statusLine).toBe('Processing payment');
    expect(copy.hint).toMatch(/keep this screen open/i);
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

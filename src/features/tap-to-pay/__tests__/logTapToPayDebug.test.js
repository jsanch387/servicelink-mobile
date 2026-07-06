jest.unmock('../utils/logTapToPayDebug');

import {
  logTapToPayDebug,
  logTapToPayFailure,
  logTapToPayInfo,
  maskId,
} from '../utils/logTapToPayDebug';

describe('logTapToPayDebug', () => {
  const originalDev = global.__DEV__;
  const originalVerboseEnv = process.env.EXPO_PUBLIC_TAP_TO_PAY_VERBOSE_LOGS;

  beforeEach(() => {
    global.__DEV__ = true;
    delete process.env.EXPO_PUBLIC_TAP_TO_PAY_VERBOSE_LOGS;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    global.__DEV__ = originalDev;
    if (originalVerboseEnv === undefined) {
      delete process.env.EXPO_PUBLIC_TAP_TO_PAY_VERBOSE_LOGS;
    } else {
      process.env.EXPO_PUBLIC_TAP_TO_PAY_VERBOSE_LOGS = originalVerboseEnv;
    }
    jest.restoreAllMocks();
  });

  it('masks long ids in verbose output when enabled', () => {
    process.env.EXPO_PUBLIC_TAP_TO_PAY_VERBOSE_LOGS = 'true';
    logTapToPayDebug('warmup.start', {
      paymentIntentId: maskId('pi_1234567890abcdef'),
    });

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('paymentIntentId=pi_12345…cdef'),
    );
  });

  it('does not emit verbose logs unless the verbose env flag is set', () => {
    logTapToPayDebug('warmup.start');
    expect(console.log).not.toHaveBeenCalled();
  });

  it('logs info events in production builds', () => {
    global.__DEV__ = false;
    logTapToPayInfo('payment.success', { amountCents: 5000 });

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[TapToPay] payment.success amountCents=5000'),
    );
  });

  it('logs failures with stage prefix in production builds', () => {
    global.__DEV__ = false;
    logTapToPayFailure('intent', {
      message: 'Set up Stripe payments to use Tap to Pay.',
      httpStatus: 422,
      requestId: 'req-1',
    });

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[TapToPay:intent]'));
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('httpStatus=422'));
  });

  it('does not emit verbose logs outside dev even with env flag', () => {
    global.__DEV__ = false;
    process.env.EXPO_PUBLIC_TAP_TO_PAY_VERBOSE_LOGS = 'true';
    logTapToPayDebug('session.start');
    expect(console.log).not.toHaveBeenCalled();
  });
});

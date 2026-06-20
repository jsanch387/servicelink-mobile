jest.unmock('../utils/logTapToPayDebug');

import { logTapToPayDebug, logTapToPayFailure, maskId } from '../utils/logTapToPayDebug';

describe('logTapToPayDebug', () => {
  const originalDev = global.__DEV__;

  beforeEach(() => {
    global.__DEV__ = true;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    global.__DEV__ = originalDev;
    jest.restoreAllMocks();
  });

  it('masks long ids in debug output', () => {
    logTapToPayDebug('intent.ok', {
      paymentIntentId: maskId('pi_1234567890abcdef'),
    });

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('paymentIntentId=pi_12345…cdef'),
    );
  });

  it('logs failures with stage prefix', () => {
    logTapToPayFailure('intent', {
      message: 'Set up Stripe payments to use Tap to Pay.',
      httpStatus: 422,
      requestId: 'req-1',
    });

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[TapToPay:intent]'));
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('httpStatus=422'));
  });

  it('does not log outside dev', () => {
    global.__DEV__ = false;
    logTapToPayDebug('session.start');
    logTapToPayFailure('intent', { message: 'nope' });
    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });
});

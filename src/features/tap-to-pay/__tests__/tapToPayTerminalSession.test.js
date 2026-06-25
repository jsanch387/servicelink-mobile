import {
  clearTapToPayConnected,
  getTapToPayTerminalSessionSnapshot,
  isTapToPayReaderWarm,
  markTapToPayConnected,
  markTapToPayInitialized,
  resetTapToPayTerminalSession,
} from '../terminal/tapToPayTerminalSession';

describe('tapToPayTerminalSession', () => {
  beforeEach(() => {
    resetTapToPayTerminalSession();
  });

  it('isTapToPayReaderWarm is false until initialized and connected', () => {
    expect(isTapToPayReaderWarm()).toBe(false);

    markTapToPayInitialized('acct_1');
    expect(isTapToPayReaderWarm()).toBe(false);

    markTapToPayConnected('tml_1|acct_1');
    expect(isTapToPayReaderWarm()).toBe(true);
  });

  it('clearTapToPayConnected drops reader warm without resetting SDK init', () => {
    markTapToPayInitialized('acct_1');
    markTapToPayConnected('tml_1|acct_1');
    clearTapToPayConnected();

    expect(getTapToPayTerminalSessionSnapshot()).toMatchObject({
      initialized: true,
      readerWarm: false,
      lastConnectKey: null,
      isReaderWarm: false,
    });
  });

  it('resetTapToPayTerminalSession clears all session flags', () => {
    markTapToPayInitialized('acct_1');
    markTapToPayConnected('tml_1|acct_1');
    resetTapToPayTerminalSession();

    expect(getTapToPayTerminalSessionSnapshot()).toEqual({
      initialized: false,
      readerWarm: false,
      hasConnectKey: false,
      lastConnectKey: null,
      lastInitStripeAccountId: null,
      isReaderWarm: false,
    });
  });
});

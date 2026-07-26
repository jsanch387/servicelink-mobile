import {
  connectTapToPayReaderIfNeeded,
  ensureTapToPayReaderConnected,
  mapTapToPayTerminalErrorMessage,
  prewarmTapToPayReaderSession,
  resetTapToPayReaderConnectInFlightForTests,
} from '../terminal/tapToPayTerminalConnect';
import {
  markTapToPayConnected,
  markTapToPayInitialized,
  isTapToPayReaderWarm,
  resetTapToPayTerminalSession,
  tapToPayTerminalSession,
} from '../terminal/tapToPayTerminalSession';
import { TAP_TO_PAY_PAYMENT_TIMED_OUT } from '../constants/tapToPayCopy';
import { isTapToPayAlreadyConnectedReaderError } from '../utils/isTapToPayAlreadyConnectedReaderError';

jest.mock('../education/maybePresentTapToPayEducationAfterConnect', () => ({
  maybePresentTapToPayEducationAfterConnect: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../utils/requestTapToPayAndroidPermissions', () => ({
  requestTapToPayAndroidPermissions: jest.fn().mockResolvedValue(true),
}));

function createTerminalMocks(overrides = {}) {
  return {
    initialize: jest.fn().mockResolvedValue({}),
    supportsReadersOfType: jest.fn().mockResolvedValue({ readerSupportResult: true }),
    easyConnect: jest.fn().mockResolvedValue({}),
    disconnectReader: jest.fn().mockResolvedValue({}),
    clearCachedCredentials: jest.fn().mockResolvedValue({}),
    getLocations: jest.fn().mockResolvedValue({ locations: [{ id: 'tml_fallback' }] }),
    connectParams: {
      terminalLocationId: 'tml_test',
      stripeAccountId: 'acct_test',
    },
    merchantDisplayName: 'Test Detailing',
    reason: 'test',
    ...overrides,
  };
}

function connectParamsFrom(terminal) {
  return {
    easyConnect: terminal.easyConnect,
    disconnectReader: terminal.disconnectReader,
    getLocations: terminal.getLocations,
    connectParams: terminal.connectParams,
    merchantDisplayName: terminal.merchantDisplayName,
  };
}

describe('tapToPayTerminalConnect', () => {
  beforeEach(() => {
    resetTapToPayTerminalSession();
    resetTapToPayReaderConnectInFlightForTests();
    jest.clearAllMocks();
  });

  describe('mapTapToPayTerminalErrorMessage', () => {
    it('maps timeout terminal errors to friendly copy', () => {
      expect(mapTapToPayTerminalErrorMessage('TIMEOUT', 'Reader timed out')).toBe(
        TAP_TO_PAY_PAYMENT_TIMED_OUT,
      );
      expect(mapTapToPayTerminalErrorMessage(null, 'Payment timed out waiting for card.')).toBe(
        TAP_TO_PAY_PAYMENT_TIMED_OUT,
      );
    });
  });

  describe('isTapToPayAlreadyConnectedReaderError', () => {
    it('detects already-connected codes and messages', () => {
      expect(isTapToPayAlreadyConnectedReaderError('ALREADY_CONNECTED_TO_READER', null)).toBe(true);
      expect(
        isTapToPayAlreadyConnectedReaderError(
          null,
          'Already connected to a reader. Disconnect from the reader, or power it off before trying again.',
        ),
      ).toBe(true);
      expect(isTapToPayAlreadyConnectedReaderError('TIMEOUT', 'Reader timed out')).toBe(false);
    });
  });

  describe('connectTapToPayReaderIfNeeded', () => {
    it('skips easyConnect when the reader is already warm', async () => {
      markTapToPayInitialized('acct_test');
      markTapToPayConnected('tml_test|acct_test');

      const terminal = createTerminalMocks();
      await connectTapToPayReaderIfNeeded({
        ...connectParamsFrom(terminal),
        reason: 'test_warm_skip',
      });

      expect(terminal.easyConnect).not.toHaveBeenCalled();
    });

    it('connects when cold and dedupes concurrent callers', async () => {
      let resolveConnect;
      const connectDone = new Promise((resolve) => {
        resolveConnect = resolve;
      });

      const terminal = createTerminalMocks({
        easyConnect: jest.fn().mockImplementation(() => connectDone),
      });
      markTapToPayInitialized('acct_test');

      const params = { ...connectParamsFrom(terminal), reason: 'test_dedupe' };
      const first = connectTapToPayReaderIfNeeded({ ...params, reason: 'test_dedupe_a' });
      const second = connectTapToPayReaderIfNeeded({ ...params, reason: 'test_dedupe_b' });

      await Promise.resolve();
      expect(terminal.easyConnect).toHaveBeenCalledTimes(1);

      resolveConnect({});
      await Promise.all([first, second]);
      expect(isTapToPayReaderWarm()).toBe(true);
    });
  });

  describe('ensureTapToPayReaderConnected', () => {
    it('recovers from already-connected by disconnecting then retrying once', async () => {
      markTapToPayInitialized('acct_test');
      // Cold JS session, but native SDK still holds a reader (Fitz-style desync).
      expect(tapToPayTerminalSession.lastConnectKey).toBeNull();

      const terminal = createTerminalMocks({
        easyConnect: jest
          .fn()
          .mockResolvedValueOnce({
            error: {
              code: 'ALREADY_CONNECTED_TO_READER',
              message:
                'Already connected to a reader. Disconnect from the reader, or power it off before trying again.',
            },
          })
          .mockResolvedValueOnce({}),
      });

      await ensureTapToPayReaderConnected({
        ...connectParamsFrom(terminal),
        reason: 'collect',
      });

      expect(terminal.disconnectReader).toHaveBeenCalledTimes(1);
      expect(terminal.easyConnect).toHaveBeenCalledTimes(2);
      expect(isTapToPayReaderWarm()).toBe(true);
      expect(tapToPayTerminalSession.lastConnectKey).toBe('tml_test|acct_test');
    });

    it('does not retry unrelated connect failures', async () => {
      markTapToPayInitialized('acct_test');
      const terminal = createTerminalMocks({
        easyConnect: jest.fn().mockResolvedValue({
          error: { code: 'UNEXPECTED_ERROR', message: 'Something else failed' },
        }),
      });

      await expect(
        ensureTapToPayReaderConnected({
          ...connectParamsFrom(terminal),
          reason: 'collect',
        }),
      ).rejects.toThrow(/Something else failed/);

      expect(terminal.disconnectReader).not.toHaveBeenCalled();
      expect(terminal.easyConnect).toHaveBeenCalledTimes(1);
      expect(isTapToPayReaderWarm()).toBe(false);
    });
  });

  describe('prewarmTapToPayReaderSession', () => {
    it('initializes SDK and connects the reader when cold', async () => {
      const terminal = createTerminalMocks();

      await prewarmTapToPayReaderSession(terminal);

      expect(terminal.initialize).toHaveBeenCalledTimes(1);
      expect(terminal.supportsReadersOfType).toHaveBeenCalledWith({
        deviceType: 'tapToPay',
        simulated: false,
        discoveryMethod: 'tapToPay',
      });
      expect(terminal.easyConnect).toHaveBeenCalledTimes(1);
      expect(isTapToPayReaderWarm()).toBe(true);
    });
  });
});

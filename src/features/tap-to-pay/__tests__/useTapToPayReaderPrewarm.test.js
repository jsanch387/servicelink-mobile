import { renderHook, waitFor } from '@testing-library/react-native';
import { useTapToPayReaderPrewarm } from '../hooks/useTapToPayReaderPrewarm';
import { prewarmTapToPayReaderSession } from '../terminal/tapToPayTerminalConnect';
import { isTapToPayMerchantEnabled } from '../utils/tapToPayEnablementStorage';

jest.mock('@stripe/stripe-terminal-react-native', () => ({
  useStripeTerminal: jest.fn(),
}));

jest.mock('../terminal/tapToPayTerminalConnect', () => ({
  prewarmTapToPayReaderSession: jest.fn(),
}));

jest.mock('../constants/tapToPayFeatureFlags', () => ({
  TAP_TO_PAY_USE_TERMINAL_SDK: true,
}));

jest.mock('../utils/tapToPayEnablementStorage', () => ({
  isTapToPayMerchantEnabled: jest.fn(),
}));

const { useStripeTerminal } = require('@stripe/stripe-terminal-react-native');

const connectParams = {
  terminalLocationId: 'tml_123',
  stripeAccountId: 'acct_123',
};

describe('useTapToPayReaderPrewarm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStripeTerminal.mockReturnValue({
      initialize: jest.fn(),
      supportsReadersOfType: jest.fn(),
      easyConnect: jest.fn(),
      disconnectReader: jest.fn(),
      clearCachedCredentials: jest.fn(),
      getLocations: jest.fn(),
    });
    isTapToPayMerchantEnabled.mockResolvedValue(true);
    prewarmTapToPayReaderSession.mockResolvedValue(undefined);
  });

  it('does not prewarm when disabled', async () => {
    renderHook(() =>
      useTapToPayReaderPrewarm({
        enabled: false,
        connectParams,
      }),
    );

    await waitFor(() => {
      expect(isTapToPayMerchantEnabled).not.toHaveBeenCalled();
    });
    expect(prewarmTapToPayReaderSession).not.toHaveBeenCalled();
  });

  it('skips prewarm when merchant has not opted in on device', async () => {
    isTapToPayMerchantEnabled.mockResolvedValue(false);

    renderHook(() =>
      useTapToPayReaderPrewarm({
        enabled: true,
        connectParams,
        reason: 'complete_sheet',
      }),
    );

    await waitFor(() => {
      expect(isTapToPayMerchantEnabled).toHaveBeenCalledWith('acct_123', 'tml_123');
    });
    expect(prewarmTapToPayReaderSession).not.toHaveBeenCalled();
  });

  it('prewarms reader when enabled and merchant opted in', async () => {
    renderHook(() =>
      useTapToPayReaderPrewarm({
        enabled: true,
        connectParams,
        merchantDisplayName: 'Test Shop',
        reason: 'complete_sheet',
      }),
    );

    await waitFor(() => {
      expect(prewarmTapToPayReaderSession).toHaveBeenCalledTimes(1);
    });

    expect(prewarmTapToPayReaderSession.mock.calls[0][0]).toMatchObject({
      connectParams,
      merchantDisplayName: 'Test Shop',
      reason: 'complete_sheet',
    });
  });
});

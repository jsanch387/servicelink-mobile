import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useTapToPayEnablement } from '../hooks/useTapToPayEnablement';
import { warmTapToPayReader } from '../terminal/tapToPayTerminalConnect';
import {
  markTapToPayConnected,
  markTapToPayInitialized,
  resetTapToPayTerminalSession,
} from '../terminal/tapToPayTerminalSession';
import {
  isTapToPayMerchantEnabled,
  markTapToPayMerchantEnabled,
} from '../utils/tapToPayEnablementStorage';

jest.mock('../../auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../hooks/useTapToPayConnectReadiness', () => ({
  useTapToPayConnectReadiness: jest.fn(),
}));

jest.mock('@stripe/stripe-terminal-react-native', () => ({
  useStripeTerminal: jest.fn(),
}));

jest.mock('../terminal/tapToPayTerminalConnect', () => ({
  warmTapToPayReader: jest.fn(),
}));

jest.mock('../utils/tapToPayEnablementStorage', () => ({
  ...jest.requireActual('../utils/tapToPayEnablementStorage'),
  isTapToPayMerchantEnabled: jest.fn(),
  markTapToPayMerchantEnabled: jest.fn(),
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const { useAuth } = require('../../auth');
const { useTapToPayConnectReadiness } = require('../hooks/useTapToPayConnectReadiness');
const { useStripeTerminal } = require('@stripe/stripe-terminal-react-native');

const defaultReadiness = {
  isConnectReady: true,
  isLoading: false,
  merchantDisplayName: 'Test Shop',
  terminalLocationId: 'tml_123',
  stripeAccountId: 'acct_123',
  refetch: jest.fn(),
};

const defaultTerminal = {
  initialize: jest.fn(),
  supportsReadersOfType: jest.fn(),
  easyConnect: jest.fn(),
  disconnectReader: jest.fn(),
  clearCachedCredentials: jest.fn(),
  getLocations: jest.fn(),
};

describe('useTapToPayEnablement', () => {
  beforeEach(() => {
    resetTapToPayTerminalSession();
    jest.clearAllMocks();
    useAuth.mockReturnValue({ session: { access_token: 'token' } });
    useTapToPayConnectReadiness.mockReturnValue(defaultReadiness);
    useStripeTerminal.mockReturnValue(defaultTerminal);
    isTapToPayMerchantEnabled.mockResolvedValue(false);
    markTapToPayMerchantEnabled.mockResolvedValue(undefined);
    warmTapToPayReader.mockResolvedValue(undefined);
  });

  it('shows Enabled when opted in on device even if reader session is cold', async () => {
    isTapToPayMerchantEnabled.mockResolvedValue(true);

    const { result } = renderHook(() => useTapToPayEnablement());

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    expect(result.current.isEnabled).toBe(true);
    expect(result.current.isOptedIn).toBe(true);
    expect(result.current.isReaderReady).toBe(false);
    expect(result.current.needsReconnect).toBe(true);
  });

  it('shows not enabled when Connect is not ready', async () => {
    useTapToPayConnectReadiness.mockReturnValue({
      ...defaultReadiness,
      isConnectReady: false,
    });
    isTapToPayMerchantEnabled.mockResolvedValue(true);

    const { result } = renderHook(() => useTapToPayEnablement());

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    expect(result.current.canEnable).toBe(false);
    expect(result.current.isEnabled).toBe(false);
  });

  it('runs warm connect on enable and marks merchant enabled', async () => {
    const { result } = renderHook(() => useTapToPayEnablement());

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    let ok = false;
    await act(async () => {
      ok = await result.current.enable();
    });

    expect(ok).toBe(true);
    expect(warmTapToPayReader).toHaveBeenCalledTimes(1);
    expect(warmTapToPayReader.mock.calls[0][0].reason).toBe('enable');
    expect(markTapToPayMerchantEnabled).toHaveBeenCalledWith('acct_123', 'tml_123');
  });

  it('skips warm connect when opted in and reader is already warm', async () => {
    isTapToPayMerchantEnabled.mockResolvedValue(true);
    markTapToPayInitialized('acct_123');
    markTapToPayConnected('tml_123|acct_123');

    const { result } = renderHook(() => useTapToPayEnablement());

    await waitFor(() => {
      expect(result.current.isEnabled).toBe(true);
    });

    let ok = false;
    await act(async () => {
      ok = await result.current.enable();
    });

    expect(ok).toBe(true);
    expect(warmTapToPayReader).not.toHaveBeenCalled();
  });

  it('alerts on enable failure', async () => {
    warmTapToPayReader.mockRejectedValue(new Error('Connect failed'));

    const { result } = renderHook(() => useTapToPayEnablement());

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.enable();
    });

    expect(ok).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith('Tap to Pay', 'Connect failed');
  });
});

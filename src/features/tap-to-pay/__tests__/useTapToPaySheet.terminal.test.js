import { renderHook, waitFor } from '@testing-library/react-native';
import { useTapToPaySheet } from '../hooks/useTapToPaySheet';
import { resetTapToPayTerminalSession } from '../terminal/tapToPayTerminalSession';

jest.mock('../api/postTapToPayIntent', () => ({
  postTapToPayIntent: jest.fn(),
}));

jest.mock('../api/postTapToPayConnectionToken', () => ({
  postTapToPayConnectionToken: jest.fn(),
}));

jest.mock('../utils/tapToPayHaptics', () => ({
  fireTapToPayCollectStartHaptic: jest.fn(),
  fireTapToPayErrorHaptic: jest.fn(),
  fireTapToPayRetryHaptic: jest.fn(),
  fireTapToPaySuccessHaptic: jest.fn(),
}));

const mockPrewarmReaderForCollect = jest.fn().mockResolvedValue(undefined);
const mockCollectPayment = jest.fn().mockResolvedValue({
  paymentIntentId: 'pi_test',
  amountCents: 5000,
});

jest.mock('../hooks/useTapToPayTerminalCollection', () => ({
  useTapToPayTerminalCollection: () => ({
    collectPayment: mockCollectPayment,
    prewarmReaderForCollect: mockPrewarmReaderForCollect,
  }),
}));

jest.mock('../constants/tapToPayFeatureFlags', () => ({
  TAP_TO_PAY_USE_SERVER_APIS: true,
  TAP_TO_PAY_USE_TERMINAL_SDK: true,
  TAP_TO_PAY_DEV_MOCK_COLLECTION: false,
}));

jest.mock('../constants/tapToPayTimings', () => ({
  TAP_TO_PAY_PENDING_MS: 10,
  TAP_TO_PAY_SUCCESS_DISMISS_MS: 10,
}));

const { postTapToPayIntent } = require('../api/postTapToPayIntent');

describe('useTapToPaySheet (Terminal SDK)', () => {
  beforeEach(() => {
    resetTapToPayTerminalSession();
    postTapToPayIntent.mockReset();
    mockPrewarmReaderForCollect.mockClear();
    mockCollectPayment.mockClear();
    postTapToPayIntent.mockResolvedValue({
      ok: true,
      paymentIntentId: 'pi_test',
      clientSecret: 'pi_test_secret',
      amountCents: 5000,
      connectParams: {
        terminalLocationId: 'tml_123',
        stripeAccountId: 'acct_123',
      },
    });
  });

  it('starts in preparing phase and prewarms reader in parallel with intent when cold', async () => {
    const { result } = renderHook(() =>
      useTapToPaySheet({
        accessToken: 'token',
        bookingId: 'booking-1',
        sessionFees: [],
        amountDueDollars: 50,
        prewarmConnectParams: {
          terminalLocationId: 'tml_123',
          stripeAccountId: 'acct_123',
        },
        onSuccess: jest.fn(),
        onClose: jest.fn(),
        runClose: jest.fn(),
      }),
    );

    expect(result.current.phase).toBe('preparing');
    expect(result.current.readerWasWarmAtStart).toBe(false);

    await waitFor(() => {
      expect(postTapToPayIntent).toHaveBeenCalled();
      expect(mockPrewarmReaderForCollect).toHaveBeenCalledWith({
        connectParams: {
          terminalLocationId: 'tml_123',
          stripeAccountId: 'acct_123',
        },
        merchantDisplayName: null,
        reason: 'collect_parallel',
      });
    });

    await waitFor(() => {
      expect(result.current.phase).toBe('success');
    });
    expect(mockCollectPayment).toHaveBeenCalledTimes(1);
  });

  it('maps collection failures to error phase', async () => {
    mockCollectPayment.mockRejectedValue(new Error('Payment was canceled.'));

    const { result } = renderHook(() =>
      useTapToPaySheet({
        accessToken: 'token',
        bookingId: 'booking-1',
        sessionFees: [],
        amountDueDollars: 50,
        onSuccess: jest.fn(),
        onClose: jest.fn(),
        runClose: jest.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.phase).toBe('error');
    });
    expect(result.current.showTryAgainFooter).toBe(true);
    expect(result.current.intentError).toMatch(/canceled/i);
  });
});

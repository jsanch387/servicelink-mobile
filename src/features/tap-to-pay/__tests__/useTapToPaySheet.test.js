import { renderHook, waitFor } from '@testing-library/react-native';
import { useTapToPaySheet } from '../hooks/useTapToPaySheet';

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

jest.mock('../hooks/useTapToPayTerminalCollection', () => ({
  useTapToPayTerminalCollection: () => ({
    collectPayment: jest.fn(),
  }),
}));

jest.mock('../constants/tapToPayFeatureFlags', () => ({
  TAP_TO_PAY_USE_SERVER_APIS: true,
  TAP_TO_PAY_USE_TERMINAL_SDK: false,
  TAP_TO_PAY_DEV_MOCK_COLLECTION: true,
}));

jest.mock('../constants/tapToPayTimings', () => ({
  TAP_TO_PAY_PENDING_MS: 10,
  TAP_TO_PAY_SUCCESS_DISMISS_MS: 10,
}));

const { postTapToPayIntent } = require('../api/postTapToPayIntent');
const { fireTapToPayErrorHaptic } = require('../utils/tapToPayHaptics');

describe('useTapToPaySheet', () => {
  beforeEach(() => {
    postTapToPayIntent.mockReset();
    fireTapToPayErrorHaptic.mockClear();
  });

  it('requires booking id when server APIs are enabled', async () => {
    const { result } = renderHook(() =>
      useTapToPaySheet({
        accessToken: 'token',
        bookingId: null,
        sessionFees: [],
        amountDueDollars: 50,
        onSuccess: jest.fn(),
        onClose: jest.fn(),
        runClose: jest.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.phase).toBe('intent_error');
    });
    expect(result.current.intentError).toMatch(/Sign in again/);
    expect(postTapToPayIntent).not.toHaveBeenCalled();
  });

  it('loads intent and starts collection when the sheet opens', async () => {
    postTapToPayIntent.mockResolvedValue({
      ok: true,
      paymentIntentId: 'pi_test',
      clientSecret: 'pi_test_secret',
      amountCents: 5000,
      currency: 'usd',
    });

    const { result } = renderHook(() =>
      useTapToPaySheet({
        accessToken: 'token',
        bookingId: 'booking-1',
        sessionFees: [{ label: 'Fee', amountCents: 500 }],
        amountDueDollars: 50,
        onSuccess: jest.fn(),
        onClose: jest.fn(),
        runClose: jest.fn(),
      }),
    );

    await waitFor(() => {
      expect(postTapToPayIntent).toHaveBeenCalledWith('token', 'booking-1', [
        { label: 'Fee', amountCents: 500 },
      ]);
    });

    await waitFor(() => {
      expect(result.current.phase).toBe('success');
    });
    expect(result.current.displayAmountDollars).toBe(50);
  });

  it('maps intent API failures to intent_error on open', async () => {
    postTapToPayIntent.mockResolvedValue({
      ok: false,
      error: new Error('Set up Stripe payments to use Tap to Pay.'),
      httpStatus: 422,
    });

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
      expect(result.current.phase).toBe('intent_error');
      expect(result.current.intentError).toMatch(/Set up Stripe payments/);
    });
    expect(fireTapToPayErrorHaptic).toHaveBeenCalledTimes(1);
  });
});

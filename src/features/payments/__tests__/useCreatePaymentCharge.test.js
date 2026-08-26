import { act, renderHook } from '@testing-library/react-native';
import { useCreatePaymentCharge } from '../create-payment/hooks/useCreatePaymentCharge';

const mockCollectPayment = jest.fn();
const mockToast = { success: jest.fn(), error: jest.fn(), info: jest.fn() };

jest.mock('../../../components/ui', () => ({
  useToast: () => mockToast,
}));

jest.mock('../../tap-to-pay/api/postTapToPayMerchantIntent', () => ({
  postTapToPayMerchantIntent: jest.fn(),
}));

jest.mock('../../tap-to-pay/constants/tapToPayFeatureFlags', () => ({
  isTapToPayUiEnabled: () => true,
}));

jest.mock('../../tap-to-pay/hooks/useTapToPayConnectReadiness', () => ({
  useTapToPayConnectReadiness: () => ({
    isConnectReady: true,
    merchantDisplayName: 'Acme',
    stripeAccountId: 'acct_1',
    terminalLocationId: 'tml_1',
  }),
}));

const mockPrewarmReaderForCollect = jest.fn();

jest.mock('../../tap-to-pay/hooks/useTapToPayTerminalCollection', () => ({
  useTapToPayTerminalCollection: () => ({
    collectPayment: mockCollectPayment,
    prewarmReaderForCollect: mockPrewarmReaderForCollect,
  }),
}));

jest.mock('../../tap-to-pay/terminal/tapToPayTerminalSession', () => ({
  isTapToPayReaderWarm: jest.fn(() => false),
}));

jest.mock('../../tap-to-pay/terminal/tapToPayConnectionTokenRegistry', () => ({
  setTapToPayConnectionTokenStripeAccountId: jest.fn(),
}));

jest.mock('../../tap-to-pay/utils/isTapToPayNativeRuntimeAvailable', () => ({
  isTapToPayNativeRuntimeAvailable: () => true,
}));

const { postTapToPayMerchantIntent } = require('../../tap-to-pay/api/postTapToPayMerchantIntent');

describe('useCreatePaymentCharge', () => {
  const onSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    postTapToPayMerchantIntent.mockResolvedValue({
      ok: true,
      paymentIntentId: 'pi_1',
      clientSecret: 'secret',
      amountCents: 4000,
      connectParams: {},
    });
    mockCollectPayment.mockResolvedValue({
      paymentIntentId: 'pi_1',
      amountCents: 4000,
    });
    mockPrewarmReaderForCollect.mockResolvedValue(undefined);
  });

  it('creates a walk-up intent and collects', async () => {
    const { result } = renderHook(() =>
      useCreatePaymentCharge({
        accessToken: 't',
        amount: '40',
        note: 'Lights',
        onSuccess,
      }),
    );

    await act(async () => {
      await result.current.charge();
    });

    expect(postTapToPayMerchantIntent).toHaveBeenCalledWith('t', {
      amountCents: 4000,
      note: 'Lights',
      stripeAccountId: 'acct_1',
    });
    expect(mockCollectPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        clientSecret: 'secret',
        paymentIntentId: 'pi_1',
        amountCents: 4000,
      }),
    );
    expect(mockPrewarmReaderForCollect).toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('success');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('keeps the overlay open with Try again after cancel', async () => {
    mockCollectPayment.mockRejectedValueOnce(
      Object.assign(new Error('The command was canceled.'), { code: 'CANCELED' }),
    );
    const { result } = renderHook(() =>
      useCreatePaymentCharge({
        accessToken: 't',
        amount: '40',
        note: 'Lights',
        onSuccess,
      }),
    );

    await act(async () => {
      await result.current.charge();
    });

    expect(result.current.phase).toBe('error');
    expect(result.current.charging).toBe(false);
    expect(result.current.error).toMatch(/canceled/i);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('maps intent failures onto the collect form', async () => {
    postTapToPayMerchantIntent.mockResolvedValueOnce({
      ok: false,
      error: new Error('Set up Stripe payments to use Tap to Pay.'),
    });
    const { result } = renderHook(() =>
      useCreatePaymentCharge({
        accessToken: 't',
        amount: '40',
        note: 'Lights',
        onSuccess,
      }),
    );

    await act(async () => {
      await result.current.charge();
    });

    expect(result.current.phase).toBe('intent_error');
    expect(result.current.error).toMatch(/Set up Stripe/);
    expect(mockCollectPayment).not.toHaveBeenCalled();
  });

  it('does not collect without a note', async () => {
    const { result } = renderHook(() =>
      useCreatePaymentCharge({
        accessToken: 't',
        amount: '40',
        note: '  ',
        onSuccess,
      }),
    );

    await act(async () => {
      await result.current.charge();
    });

    expect(postTapToPayMerchantIntent).not.toHaveBeenCalled();
    expect(mockCollectPayment).not.toHaveBeenCalled();
  });

  it('previews the Paid screen without creating an intent', () => {
    const { result } = renderHook(() =>
      useCreatePaymentCharge({
        accessToken: 't',
        amount: '40',
        note: 'Lights',
        onSuccess,
      }),
    );

    act(() => {
      result.current.previewPaid();
    });

    expect(postTapToPayMerchantIntent).not.toHaveBeenCalled();
    expect(mockCollectPayment).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('success');
    expect(onSuccess).toHaveBeenCalledWith({
      paymentIntentId: null,
      amountCents: 4000,
    });
  });
});

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

jest.mock('../../tap-to-pay/hooks/useTapToPayTerminalCollection', () => ({
  useTapToPayTerminalCollection: () => ({
    collectPayment: mockCollectPayment,
  }),
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
  });

  it('creates a walk-up intent and collects without a sheet', async () => {
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
    expect(mockToast.success).toHaveBeenCalledWith('Paid');
    expect(onSuccess).toHaveBeenCalled();
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
});

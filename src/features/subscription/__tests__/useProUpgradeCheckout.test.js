import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ROUTES } from '../../../routes/routes';
import { createPaywallUpgradeCheckoutSession } from '../api/createPaywallUpgradeCheckoutSession';
import { STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL } from '../constants/stripePaywallCheckoutReturnUrl';
import { useProUpgradeCheckout } from '../hooks/useProUpgradeCheckout';

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('../api/createPaywallUpgradeCheckoutSession', () => ({
  createPaywallUpgradeCheckoutSession: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockRefetchSubscription = jest.fn();

jest.mock('../../../navigation/navigationRef', () => ({
  navigationRef: {
    isReady: jest.fn(() => true),
    navigate: (...args) => mockNavigate(...args),
  },
}));

jest.mock('../../auth', () => ({
  useAuth: () => ({ session: { access_token: 'jwt-token' }, user: { id: 'user_1' } }),
}));

const mockRefetchAccountAfterUpgradeCheckout = jest.fn();

jest.mock('../utils/refetchAccountAfterUpgradeCheckout', () => ({
  refetchAccountAfterUpgradeCheckout: (...args) => mockRefetchAccountAfterUpgradeCheckout(...args),
}));

jest.mock('../context/SubscriptionContext', () => ({
  useSubscription: () => ({ refetchSubscription: mockRefetchSubscription }),
}));

describe('useProUpgradeCheckout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockRefetchSubscription.mockResolvedValue(undefined);
    mockRefetchAccountAfterUpgradeCheckout.mockResolvedValue({ hasProAccess: true });
    createPaywallUpgradeCheckoutSession.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/cs_test',
    });
  });

  it('navigates to Account after successful Stripe return', async () => {
    WebBrowser.openAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'servicelinkmobile://paywall/stripe?result=success',
    });

    const { result } = renderHook(() => useProUpgradeCheckout());

    await act(async () => {
      await result.current.startUpgradeCheckout();
    });

    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://checkout.stripe.com/c/pay/cs_test',
      STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL,
    );
    expect(mockRefetchAccountAfterUpgradeCheckout).toHaveBeenCalledWith({ userId: 'user_1' });
    expect(mockRefetchSubscription).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: { screen: ROUTES.ACCOUNT_SETTINGS },
    });
  });

  it('does not navigate to Account when checkout is cancelled', async () => {
    WebBrowser.openAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'servicelinkmobile://paywall/stripe?result=cancel',
    });

    const { result } = renderHook(() => useProUpgradeCheckout());

    await act(async () => {
      await result.current.startUpgradeCheckout();
    });

    expect(mockRefetchSubscription).toHaveBeenCalled();
    expect(mockRefetchAccountAfterUpgradeCheckout).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

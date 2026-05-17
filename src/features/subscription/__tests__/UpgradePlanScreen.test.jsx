import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ROUTES } from '../../../routes/routes';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { createPaywallUpgradeCheckoutSession } from '../api/createPaywallUpgradeCheckoutSession';
import { STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL } from '../constants/stripePaywallCheckoutReturnUrl';
import { UpgradePlanScreen } from '../screens/UpgradePlanScreen';

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('../api/createPaywallUpgradeCheckoutSession', () => ({
  createPaywallUpgradeCheckoutSession: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockUseAuth = jest.fn();
const mockUseSubscription = jest.fn();

jest.mock('../../../navigation/navigationRef', () => ({
  navigationRef: {
    isReady: jest.fn(() => true),
    navigate: (...args) => mockNavigate(...args),
  },
}));

jest.mock('../../auth', () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

jest.mock('../context/SubscriptionContext', () => ({
  useSubscription: (...args) => mockUseSubscription(...args),
}));

jest.mock('../utils/refetchAccountAfterUpgradeCheckout', () => ({
  refetchAccountAfterUpgradeCheckout: jest.fn().mockResolvedValue({ hasProAccess: true }),
}));

function freeSubscription() {
  return {
    hasProAccess: false,
    ownerProfile: {
      subscription_tier: 'free',
      subscription_status: null,
      subscription_current_period_end: null,
      subscription_cancel_at_period_end: false,
      stripe_subscription_id: null,
      stripe_customer_id: null,
    },
    refetchSubscription: jest.fn().mockResolvedValue(undefined),
  };
}

describe('UpgradePlanScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockUseAuth.mockReturnValue({ session: { access_token: 'jwt-token' }, user: { id: 'user_1' } });
    mockUseSubscription.mockReturnValue(freeSubscription());
  });

  it('shows plan comparison and starts checkout for free users', async () => {
    createPaywallUpgradeCheckoutSession.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/cs_test',
    });
    WebBrowser.openAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'servicelinkmobile://paywall/stripe?result=success',
    });

    renderWithProviders(<UpgradePlanScreen />);

    expect(screen.getByText('What you get')).toBeTruthy();
    expect(screen.getByText('Unlimited bookings')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Upgrade to Pro' }));

    await waitFor(() =>
      expect(createPaywallUpgradeCheckoutSession).toHaveBeenCalledWith('jwt-token'),
    );
    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://checkout.stripe.com/c/pay/cs_test',
      STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL,
    );
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
        screen: ROUTES.MORE,
        params: { screen: ROUTES.ACCOUNT_SETTINGS },
      }),
    );
  });

  it('shows manage subscription for Pro users', () => {
    mockUseSubscription.mockReturnValue({
      hasProAccess: true,
      ownerProfile: {
        subscription_tier: 'pro',
        subscription_status: 'active',
        subscription_current_period_end: '2030-01-01T00:00:00.000Z',
        subscription_cancel_at_period_end: false,
        stripe_subscription_id: 'sub_1',
        stripe_customer_id: 'cus_1',
      },
      refetchSubscription: jest.fn(),
    });

    renderWithProviders(<UpgradePlanScreen />);

    expect(screen.getByText('Your Pro plan')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Manage subscription' }));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
      screen: ROUTES.MORE,
      params: { screen: ROUTES.ACCOUNT_SETTINGS },
    });
  });
});

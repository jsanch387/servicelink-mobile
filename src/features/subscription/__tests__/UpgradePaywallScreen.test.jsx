import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { createPaywallUpgradeCheckoutSession } from '../api/createPaywallUpgradeCheckoutSession';
import { STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL } from '../constants/stripePaywallCheckoutReturnUrl';
import { UpgradePaywallScreen } from '../screens/UpgradePaywallScreen';

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('../api/createPaywallUpgradeCheckoutSession', () => ({
  createPaywallUpgradeCheckoutSession: jest.fn(),
}));

const mockUseAuth = jest.fn();
const mockUseSubscription = jest.fn();

jest.mock('../../auth', () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

jest.mock('../context/SubscriptionContext', () => ({
  useSubscription: (...args) => mockUseSubscription(...args),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 80,
}));

function defaultAuth() {
  return {
    session: { access_token: 'jwt-upgrade-token' },
  };
}

function defaultSubscription() {
  return {
    refetchSubscription: jest.fn().mockResolvedValue(undefined),
  };
}

describe('UpgradePaywallScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockUseAuth.mockReturnValue(defaultAuth());
    mockUseSubscription.mockReturnValue(defaultSubscription());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders hero copy and upgrade CTA', () => {
    renderWithProviders(<UpgradePaywallScreen />);
    expect(screen.getByText('Keep using ServiceLink')).toBeTruthy();
    expect(
      screen.getByText('Upgrade to Pro to unlock all features and run your business.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeTruthy();
  });

  it('starts checkout, opens Stripe session, then refetches subscription', async () => {
    createPaywallUpgradeCheckoutSession.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/cs_test_paywall',
    });
    WebBrowser.openAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'servicelinkmobile://paywall/stripe?result=success',
    });
    const refetchSubscription = jest.fn().mockResolvedValue(undefined);
    mockUseSubscription.mockReturnValue({ refetchSubscription });

    renderWithProviders(<UpgradePaywallScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Upgrade to Pro' }));

    await waitFor(() =>
      expect(createPaywallUpgradeCheckoutSession).toHaveBeenCalledWith('jwt-upgrade-token'),
    );
    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://checkout.stripe.com/c/pay/cs_test_paywall',
      STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL,
    );
    await waitFor(() => expect(refetchSubscription).toHaveBeenCalledTimes(1));
  });

  it('refetches subscription after checkout session even when browser returns dismiss', async () => {
    createPaywallUpgradeCheckoutSession.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/cs_test_paywall',
    });
    WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'dismiss' });
    const refetchSubscription = jest.fn().mockResolvedValue(undefined);
    mockUseSubscription.mockReturnValue({ refetchSubscription });

    renderWithProviders(<UpgradePaywallScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Upgrade to Pro' }));

    await waitFor(() => expect(refetchSubscription).toHaveBeenCalledTimes(1));
  });

  it('shows alert when checkout session API returns an error', async () => {
    createPaywallUpgradeCheckoutSession.mockResolvedValue({
      error: new Error('Mobile upgrade URLs not configured'),
      httpStatus: 500,
    });

    renderWithProviders(<UpgradePaywallScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Upgrade to Pro' }));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'Could not start checkout',
        expect.stringContaining('Mobile upgrade URLs not configured'),
      ),
    );
    expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
  });

  it('shows sign-in alert when session token is missing', async () => {
    mockUseAuth.mockReturnValue({ session: null });

    renderWithProviders(<UpgradePaywallScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Upgrade to Pro' }));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sign in required',
        'Please sign in again to continue.',
      ),
    );
    expect(createPaywallUpgradeCheckoutSession).not.toHaveBeenCalled();
  });

  it('shows checkout alert when openAuthSessionAsync throws but still refetches', async () => {
    createPaywallUpgradeCheckoutSession.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/cs_test_paywall',
    });
    WebBrowser.openAuthSessionAsync.mockRejectedValue(new Error('Session interrupted'));
    const refetchSubscription = jest.fn().mockResolvedValue(undefined);
    mockUseSubscription.mockReturnValue({ refetchSubscription });

    renderWithProviders(<UpgradePaywallScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Upgrade to Pro' }));

    await waitFor(() => expect(refetchSubscription).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'Checkout',
        expect.stringContaining('Session interrupted'),
      ),
    );
  });
});

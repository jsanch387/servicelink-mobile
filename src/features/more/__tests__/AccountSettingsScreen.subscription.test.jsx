import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { ROUTES } from '../../../routes/routes';
import { AccountSettingsScreen } from '../screens/AccountSettingsScreen';
import { refetchAccountAfterPortal } from '../utils/refetchAccountAfterPortal';

const mockUseAccountSettings = jest.fn();
const mockUseAuth = jest.fn();
const mockNavigate = jest.fn();

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('../hooks/useAccountSettings', () => ({
  useAccountSettings: (...args) => mockUseAccountSettings(...args),
}));

jest.mock('../../auth', () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

jest.mock('../utils/refetchAccountAfterPortal', () => ({
  refetchAccountAfterPortal: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 80,
}));

jest.mock('../components/ChangeBusinessSlugSheet', () => ({
  ChangeBusinessSlugSheet: () => null,
}));

jest.mock('../components/DeleteAccountConfirmSheet', () => ({
  DeleteAccountConfirmSheet: () => null,
}));

function loadedSettings(overrides = {}) {
  return {
    ownerProfile: {
      subscription_tier: 'pro',
      subscription_status: 'active',
      subscription_current_period_end: '2099-01-01T00:00:00.000Z',
      subscription_cancel_at_period_end: false,
      stripe_subscription_id: 'sub_123',
      stripe_customer_id: 'cus_123',
    },
    business: { id: 'biz_1', business_slug: 'demo' },
    isLoading: false,
    loadError: null,
    refetch: jest.fn(),
    updateSlug: jest.fn(),
    isSavingSlug: false,
    saveSlugError: null,
    resetSaveSlugError: jest.fn(),
    deleteAccount: jest.fn(),
    isDeletingAccount: false,
    deleteAccountError: null,
    resetDeleteAccountError: jest.fn(),
    createBillingPortalSession: jest.fn(),
    isCreatingBillingPortalSession: false,
    ...overrides,
  };
}

describe('AccountSettingsScreen manage subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockUseAuth.mockReturnValue({
      user: { id: 'user_1', email: 'owner@example.com' },
      session: { access_token: 'jwt-token' },
      signOut: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens Stripe portal and refetches account data after returning', async () => {
    const createBillingPortalSession = jest.fn().mockResolvedValue({
      url: 'https://billing.stripe.com/p/session/abc',
    });
    mockUseAccountSettings.mockReturnValue(loadedSettings({ createBillingPortalSession }));
    WebBrowser.openAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'servicelinkmobile://settings/subscription?ok=1',
    });
    refetchAccountAfterPortal.mockResolvedValue();

    renderWithProviders(<AccountSettingsScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Manage subscription' }));

    await waitFor(() => expect(createBillingPortalSession).toHaveBeenCalledTimes(1));
    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://billing.stripe.com/p/session/abc',
      'servicelinkmobile://settings/subscription',
    );
    await waitFor(() =>
      expect(refetchAccountAfterPortal).toHaveBeenCalledWith({ userId: 'user_1' }),
    );
  });

  it('shows alert when portal session API returns an error', async () => {
    const createBillingPortalSession = jest.fn().mockResolvedValue({
      error: new Error('No billing account found'),
      httpStatus: 400,
    });
    mockUseAccountSettings.mockReturnValue(loadedSettings({ createBillingPortalSession }));

    renderWithProviders(<AccountSettingsScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Manage subscription' }));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'Could not open billing portal',
        expect.stringContaining('No billing account found'),
      ),
    );
    expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
  });

  it('shows Upgrade to Pro for free tier and navigates to upgrade plan on press', () => {
    const createBillingPortalSession = jest.fn();
    mockUseAccountSettings.mockReturnValue(
      loadedSettings({
        ownerProfile: {
          subscription_tier: 'free',
          subscription_status: null,
          subscription_current_period_end: null,
          subscription_cancel_at_period_end: false,
          stripe_subscription_id: null,
          stripe_customer_id: null,
        },
        createBillingPortalSession,
      }),
    );

    renderWithProviders(<AccountSettingsScreen />);
    expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Upgrade to Pro' }));

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.UPGRADE_PLAN);
    expect(createBillingPortalSession).not.toHaveBeenCalled();
    expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
  });

  it('shows sign-in alert when session is missing', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user_1', email: 'owner@example.com' },
      session: null,
      signOut: jest.fn().mockResolvedValue({ error: null }),
    });
    const createBillingPortalSession = jest.fn();
    mockUseAccountSettings.mockReturnValue(loadedSettings({ createBillingPortalSession }));

    renderWithProviders(<AccountSettingsScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Manage subscription' }));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sign in required',
        'Please sign in again to continue.',
      ),
    );
    expect(createBillingPortalSession).not.toHaveBeenCalled();
  });
});

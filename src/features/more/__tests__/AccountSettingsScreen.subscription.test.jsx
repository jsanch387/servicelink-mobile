import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import {
  ACCOUNT_WEB_PANEL_NOTE_BODY,
  ACCOUNT_WEB_PANEL_NOTE_TITLE,
  ACCOUNT_WEB_PANEL_OPEN_BUTTON_LABEL,
} from '../constants/accountWebPanelNote';

jest.mock('../../../lib/webAppOrigin', () => ({
  getWebAccountAdminUrl: () => 'https://myservicelink.app/login',
}));
import { AccountSettingsScreen } from '../screens/AccountSettingsScreen';

const mockUseAccountSettings = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../hooks/useAccountSettings', () => ({
  useAccountSettings: (...args) => mockUseAccountSettings(...args),
}));

jest.mock('../../auth', () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
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
    ...overrides,
  };
}

describe('AccountSettingsScreen App Store compliance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: { id: 'user_1', email: 'owner@example.com' },
      session: { access_token: 'jwt-token' },
      signOut: jest.fn().mockResolvedValue({ error: null }),
    });
    mockUseAccountSettings.mockReturnValue(loadedSettings());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not show subscription or upgrade UI', () => {
    renderWithProviders(<AccountSettingsScreen />);

    expect(screen.queryByText('Subscription plan')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Manage subscription' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Upgrade to Pro' })).toBeNull();
    expect(screen.queryByText('Free')).toBeNull();
    expect(screen.queryByText('Pro')).toBeNull();
    expect(screen.queryByText(/\$10/)).toBeNull();
  });

  it('shows signed in, booking link, log out, delete account, and web panel note', () => {
    renderWithProviders(<AccountSettingsScreen />);

    expect(screen.getByText('owner@example.com')).toBeTruthy();
    expect(screen.getByText('Booking link')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy();
    expect(screen.getByText('Delete your account')).toBeTruthy();
    expect(screen.getByRole('header', { name: ACCOUNT_WEB_PANEL_NOTE_TITLE })).toBeTruthy();
    expect(screen.getByText(ACCOUNT_WEB_PANEL_NOTE_BODY)).toBeTruthy();
    expect(screen.getByRole('button', { name: ACCOUNT_WEB_PANEL_OPEN_BUTTON_LABEL })).toBeTruthy();
  });

  it('opens the web app when Manage account is pressed', async () => {
    renderWithProviders(<AccountSettingsScreen />);
    fireEvent.press(screen.getByRole('button', { name: ACCOUNT_WEB_PANEL_OPEN_BUTTON_LABEL }));

    await waitFor(() =>
      expect(Linking.openURL).toHaveBeenCalledWith('https://myservicelink.app/login'),
    );
  });

  it('signs out when Log out is pressed', async () => {
    const signOut = jest.fn().mockResolvedValue({ error: null });
    mockUseAuth.mockReturnValue({
      user: { id: 'user_1', email: 'owner@example.com' },
      session: { access_token: 'jwt-token' },
      signOut,
    });

    renderWithProviders(<AccountSettingsScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });
});

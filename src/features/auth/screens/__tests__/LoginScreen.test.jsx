import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import { LoginScreen } from '../LoginScreen';
import { useAuth } from '../..';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../..', () => ({
  useAuth: jest.fn(),
}));

describe('LoginScreen social sign-in', () => {
  const sendLoginCode = jest.fn();
  const signInWithPassword = jest.fn();
  const signInWithGoogle = jest.fn();
  const signInWithApple = jest.fn();
  const originalOs = Platform.OS;

  beforeEach(() => {
    Platform.OS = 'ios';
    jest.clearAllMocks();
    sendLoginCode.mockResolvedValue({ error: null });
    signInWithPassword.mockResolvedValue({ error: null });
    signInWithGoogle.mockResolvedValue({ error: null, cancelled: false });
    signInWithApple.mockResolvedValue({ error: null, cancelled: false });
    useAuth.mockReturnValue({
      sendLoginCode,
      signInWithPassword,
      signInWithGoogle,
      signInWithApple,
    });
  });

  afterEach(() => {
    Platform.OS = originalOs;
  });

  it('shows Google and Apple side by side on iOS', () => {
    renderWithProviders(<LoginScreen />);
    expect(screen.getByTestId('login-google')).toBeTruthy();
    expect(screen.getByTestId('login-apple')).toBeTruthy();
    expect(screen.getByLabelText('Continue with Google')).toBeTruthy();
    expect(screen.getByLabelText('Continue with Apple')).toBeTruthy();
  });

  it('shows only a full-width Google button on Android', () => {
    Platform.OS = 'android';
    renderWithProviders(<LoginScreen />);
    expect(screen.getByTestId('login-google')).toBeTruthy();
    expect(screen.getByLabelText('Continue with Google')).toBeTruthy();
    expect(screen.queryByTestId('login-apple')).toBeNull();
    expect(screen.queryByLabelText('Continue with Apple')).toBeNull();
  });

  it('starts Google OAuth from the login button', async () => {
    renderWithProviders(<LoginScreen />);
    fireEvent.press(screen.getByTestId('login-google'));
    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });

  it('shows a social error without navigating', async () => {
    signInWithApple.mockResolvedValue({ error: 'No account for this email', cancelled: false });
    renderWithProviders(<LoginScreen />);
    fireEvent.press(screen.getByTestId('login-apple'));
    expect(await screen.findByText('No account for this email')).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

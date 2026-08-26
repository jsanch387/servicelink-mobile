import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { CREATE_PAYMENT_TITLE } from '../create-payment/constants';
import { CreatePaymentScreen } from '../screens/CreatePaymentScreen';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();
const mockNavigate = jest.fn();
const mockNavigation = {
  goBack: mockGoBack,
  navigate: mockNavigate,
  setOptions: mockSetOptions,
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

jest.mock('../../auth', () => ({
  useAuth: () => ({
    session: { access_token: 't' },
    user: { id: 'user-1' },
  }),
}));

const mockCharge = jest.fn();

const mockCreateLink = jest.fn(async () => 'https://checkout.stripe.com/c/pay/cs_test_1');

const chargeState = { succeeds: false };

jest.mock('../create-payment/hooks/useCreatePaymentCharge', () => ({
  useCreatePaymentCharge: ({ onSuccess } = {}) => ({
    charge: () => {
      mockCharge();
      if (chargeState.succeeds) {
        onSuccess?.();
      }
    },
    charging: false,
  }),
}));

jest.mock('../create-payment/hooks/useCreatePaymentLink', () => ({
  useCreatePaymentLink: () => ({ createLink: mockCreateLink, creating: false }),
}));

const mockConnectReadiness = {
  isConnectReady: true,
  isLoading: false,
  merchantDisplayName: 'Acme',
  stripeAccountId: 'acct_1',
  terminalLocationId: 'tml_1',
};
const mockAccess = {
  featureEnabled: true,
  canUseCreatePayment: true,
  showUpsell: false,
  isReady: true,
};

jest.mock('../../tap-to-pay/hooks/useTapToPayConnectReadiness', () => ({
  useTapToPayConnectReadiness: () => mockConnectReadiness,
}));

jest.mock('../create-payment/hooks/useCreatePaymentAccess', () => ({
  useCreatePaymentAccess: () => mockAccess,
}));

jest.mock('../../home/api/homeDashboard', () => ({
  fetchBusinessProfileForUser: jest.fn(async () => ({
    data: { business_name: 'Acme Detail' },
    error: null,
  })),
}));

describe('CreatePaymentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chargeState.succeeds = false;
    mockConnectReadiness.isConnectReady = true;
    mockConnectReadiness.isLoading = false;
    mockAccess.featureEnabled = true;
    mockAccess.canUseCreatePayment = true;
    mockAccess.showUpsell = false;
    mockAccess.isReady = true;
  });

  it('lands on choose Tap to pay or Payment link', () => {
    renderWithProviders(<CreatePaymentScreen />);
    expect(screen.getByTestId('create-payment-screen')).toBeTruthy();
    expect(screen.getByTestId('create-payment-choose')).toBeTruthy();
    expect(screen.getByText(CREATE_PAYMENT_TITLE)).toBeTruthy();
    expect(screen.getByText('Take a payment.')).toBeTruthy();
    expect(screen.getByTestId('create-payment-path-collect')).toBeTruthy();
    expect(screen.getByText('Now')).toBeTruthy();
    expect(screen.getByText('Tap to pay')).toBeTruthy();
    expect(screen.getByText('They tap their card or phone on your iPhone.')).toBeTruthy();
    expect(screen.getByTestId('create-payment-path-link')).toBeTruthy();
    expect(screen.getByText('Later')).toBeTruthy();
    expect(screen.getByText('Payment link')).toBeTruthy();
    expect(screen.getByText('Send a link. They pay on their phone.')).toBeTruthy();
    expect(screen.queryByTestId('create-payment-amount')).toBeNull();
  });

  it('hides Tap to pay on Android', () => {
    const originalOs = Platform.OS;
    Platform.OS = 'android';
    try {
      renderWithProviders(<CreatePaymentScreen />);
      expect(screen.queryByTestId('create-payment-path-collect')).toBeNull();
      expect(screen.queryByText('Tap to pay')).toBeNull();
      expect(screen.getByTestId('create-payment-path-link')).toBeTruthy();
    } finally {
      Platform.OS = originalOs;
    }
  });

  it('opens tap to pay with a charge button', () => {
    renderWithProviders(<CreatePaymentScreen />);
    fireEvent.press(screen.getByTestId('create-payment-path-collect'));
    expect(screen.getByTestId('create-payment-collect')).toBeTruthy();
    expect(screen.getByTestId('create-payment-amount')).toBeTruthy();
    expect(screen.getByTestId('create-payment-charge')).toBeTruthy();
    expect(screen.getByText('Charge')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('create-payment-amount'), '40');
    fireEvent.press(screen.getByTestId('create-payment-charge'));
    expect(mockCharge).not.toHaveBeenCalled();
    fireEvent.changeText(screen.getByTestId('create-payment-note'), 'Lights');
    fireEvent.press(screen.getByTestId('create-payment-charge'));
    expect(mockCharge).toHaveBeenCalled();
    expect(screen.queryByTestId('bottom-sheet-modal')).toBeNull();
  });

  it('shows Done on the paid screen and closes', () => {
    chargeState.succeeds = true;
    renderWithProviders(<CreatePaymentScreen />);
    fireEvent.press(screen.getByTestId('create-payment-path-collect'));
    fireEvent.changeText(screen.getByTestId('create-payment-amount'), '40');
    fireEvent.changeText(screen.getByTestId('create-payment-note'), 'Lights');
    fireEvent.press(screen.getByTestId('create-payment-charge'));
    expect(screen.getByTestId('create-payment-paid')).toBeTruthy();
    expect(screen.getByText('You’re paid')).toBeTruthy();
    expect(screen.getByTestId('create-payment-paid-done')).toBeTruthy();
    fireEvent.press(screen.getByTestId('create-payment-paid-done'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('opens payment link and creates a shareable preview', async () => {
    renderWithProviders(<CreatePaymentScreen />);
    fireEvent.press(screen.getByTestId('create-payment-path-link'));
    expect(screen.getByTestId('create-payment-link-form')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('create-payment-amount'), '40');
    fireEvent.changeText(screen.getByTestId('create-payment-note'), 'Lights');
    expect(screen.getByText('Create payment link')).toBeTruthy();
    fireEvent.press(screen.getByTestId('create-payment-create-link'));
    await waitFor(() => {
      expect(mockCreateLink).toHaveBeenCalled();
    });
    expect(screen.getByTestId('create-payment-link-ready')).toBeTruthy();
    expect(screen.getByText('Payment link ready')).toBeTruthy();
    expect(screen.getByText('Share it. They pay on their phone.')).toBeTruthy();
    expect(screen.getByText('Expires in 24 hours.')).toBeTruthy();
    expect(screen.queryByText('Create payment link')).toBeNull();
    expect(screen.getByTestId('create-payment-copy-link')).toBeTruthy();
    expect(screen.getByText('Copy')).toBeTruthy();
    expect(screen.getByTestId('create-payment-share-link')).toBeTruthy();
    fireEvent.press(screen.getByTestId('create-payment-copy-link'));
    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalled();
      expect(screen.getByText('Copied')).toBeTruthy();
    });
  });

  it('sends Pro owners without Connect to Payments setup', () => {
    mockConnectReadiness.isConnectReady = false;
    renderWithProviders(<CreatePaymentScreen />);
    expect(screen.getByTestId('create-payment-connect-setup')).toBeTruthy();
    expect(screen.queryByTestId('create-payment-choose')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Open Payments' }));
    expect(mockNavigate).toHaveBeenCalledWith(
      'MainApp',
      expect.objectContaining({
        screen: 'More',
      }),
    );
  });

  it('shows the web upsell when the owner is not Pro', () => {
    mockAccess.canUseCreatePayment = false;
    mockAccess.showUpsell = true;
    renderWithProviders(<CreatePaymentScreen />);
    expect(screen.getByTestId('create-payment-pro-upsell')).toBeTruthy();
    expect(screen.getByTestId('payments-non-pro-upsell')).toBeTruthy();
    expect(screen.queryByTestId('create-payment-choose')).toBeNull();
  });

  it('wires Cancel to go back from the chooser', () => {
    renderWithProviders(<CreatePaymentScreen />);
    const headerLeft = mockSetOptions.mock.calls.at(-1)[0].headerLeft;
    const { getByLabelText } = renderWithProviders(headerLeft());
    fireEvent.press(getByLabelText('Cancel new payment'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});

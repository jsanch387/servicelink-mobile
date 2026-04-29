import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { CUSTOMER_PAYMENT_METHOD } from '../constants/customerPaymentMethods';
import { DEPOSIT_AMOUNT_MODE } from '../constants/depositAmount';

const mockUsePaymentDashboardRead = jest.fn();
const mockUseSavePaymentSettings = jest.fn();
const mockSavePaymentSettings = jest.fn();

jest.mock('../hooks/usePaymentDashboardRead', () => ({
  usePaymentDashboardRead: (...args) => mockUsePaymentDashboardRead(...args),
}));

jest.mock('../hooks/useSavePaymentSettings', () => ({
  useSavePaymentSettings: (...args) => mockUseSavePaymentSettings(...args),
}));

jest.mock('../../auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    session: { access_token: 'test-token' },
  }),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: { PAGE_SHEET: 'pageSheet' },
}));

function loadedRead(overrides = {}) {
  return {
    isPendingBusiness: false,
    businessError: null,
    business: { id: 'biz-1' },
    paymentLoadError: null,
    isPendingPayments: false,
    gateServicelinkCheckout: false,
    hasPaymentSettingsRow: true,
    paymentAccount: { id: 'pa1', stripe_account_id: 'acct_test123' },
    paymentSettings: { currency: 'usd' },
    formHydration: {
      paymentsEnabled: true,
      selectedMethodId: CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES,
      requireDeposits: true,
      depositAmount: '50',
      depositMode: DEPOSIT_AMOUNT_MODE.FIXED,
    },
    paymentsQuerySuccess: true,
    refetchPayments: jest.fn(),
    stripeConnectReady: true,
    ...overrides,
  };
}

describe('PaymentsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePaymentDashboardRead.mockReturnValue(loadedRead());
    mockSavePaymentSettings.mockResolvedValue({ business_id: 'biz-1' });
    mockUseSavePaymentSettings.mockReturnValue({
      savePaymentSettings: mockSavePaymentSettings,
      isSaving: false,
      saveError: '',
      resetSaveError: jest.fn(),
    });
  });

  it('shows loading when business query is pending', () => {
    mockUsePaymentDashboardRead.mockReturnValue(
      loadedRead({
        isPendingBusiness: true,
        business: null,
        isPendingPayments: true,
        paymentsQuerySuccess: false,
      }),
    );
    renderWithProviders(<PaymentsScreen />);
    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('shows business error', () => {
    mockUsePaymentDashboardRead.mockReturnValue(
      loadedRead({
        businessError: 'Could not load business profile',
        business: null,
        isPendingPayments: false,
        paymentsQuerySuccess: false,
      }),
    );
    renderWithProviders(<PaymentsScreen />);
    expect(screen.getByText('Could not load business profile')).toBeTruthy();
  });

  it('prompts to add business when none', () => {
    mockUsePaymentDashboardRead.mockReturnValue(
      loadedRead({
        business: null,
        isPendingPayments: false,
        paymentsQuerySuccess: false,
      }),
    );
    renderWithProviders(<PaymentsScreen />);
    expect(screen.getByText(/Add a business profile/)).toBeTruthy();
  });

  it('renders checkout section and disables save until dirty', async () => {
    renderWithProviders(<PaymentsScreen />);
    await waitFor(() => {
      expect(screen.getByText('How customers pay')).toBeTruthy();
    });
    const saveBtn = screen.getByRole('button', { name: 'Save changes' });
    expect(saveBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it('mutes checkout stack when accept payments is off', async () => {
    renderWithProviders(<PaymentsScreen />);
    await waitFor(() => expect(screen.getByText('How customers pay')).toBeTruthy());

    const switches = screen.UNSAFE_getAllByType(require('react-native').Switch);
    fireEvent(switches[0], 'valueChange', false);

    const stack = screen.getByTestId('payments-checkout-deposits-stack');
    expect(stack.props.pointerEvents).toBe('none');
    const flatStyle = StyleSheet.flatten(stack.props.style);
    expect(flatStyle.opacity).toBeCloseTo(0.4);
  });

  it('calls save with current form state', async () => {
    renderWithProviders(<PaymentsScreen />);
    await waitFor(() => expect(screen.getByText('How customers pay')).toBeTruthy());

    fireEvent.press(screen.getByRole('radio', { name: 'In the app only' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Save changes' }).props.accessibilityState?.disabled,
      ).toBe(false);
    });

    fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mockSavePaymentSettings).toHaveBeenCalledTimes(1));
    expect(mockSavePaymentSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'usd',
        paymentsEnabled: true,
        selectedMethodId: CUSTOMER_PAYMENT_METHOD.IN_APP_ONLY,
        requireDeposits: true,
        depositAmount: '50',
        depositMode: DEPOSIT_AMOUNT_MODE.FIXED,
      }),
    );
  });

  it('shows gate copy when Stripe is ready but settings row missing', async () => {
    mockUsePaymentDashboardRead.mockReturnValue(
      loadedRead({
        hasPaymentSettingsRow: false,
        gateServicelinkCheckout: true,
        paymentSettings: null,
        formHydration: {
          paymentsEnabled: false,
          selectedMethodId: CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES,
          requireDeposits: false,
          depositAmount: '0',
          depositMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
        },
      }),
    );
    renderWithProviders(<PaymentsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Turn on ServiceLink checkout on the web')).toBeTruthy();
    });
    expect(
      screen.getByRole('button', { name: 'Save changes' }).props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it('keeps save disabled without payment_settings row even after edits', async () => {
    mockUsePaymentDashboardRead.mockReturnValue(
      loadedRead({
        hasPaymentSettingsRow: false,
        gateServicelinkCheckout: false,
        paymentSettings: null,
        formHydration: {
          paymentsEnabled: false,
          selectedMethodId: CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES,
          requireDeposits: false,
          depositAmount: '0',
          depositMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
        },
      }),
    );
    renderWithProviders(<PaymentsScreen />);
    await waitFor(() => expect(screen.getByText('How customers pay')).toBeTruthy());
    fireEvent.press(screen.getByRole('radio', { name: 'In person only' }));
    expect(
      screen.getByRole('button', { name: 'Save changes' }).props.accessibilityState?.disabled,
    ).toBe(true);
  });
});

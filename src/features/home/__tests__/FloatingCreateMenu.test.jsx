import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { CREATE_PAYMENT_HIGHLIGHT_SEEN_KEY } from '../../payments/create-payment/storage/createPaymentHighlightStorage';
import { FloatingCreateMenu } from '../components/FloatingCreateMenu';
import { renderWithProviders } from './testUtils';

describe('FloatingCreateMenu payment highlight', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('shows the New payment treatment once, then the regular row', async () => {
    renderWithProviders(
      <FloatingCreateMenu showCreatePayment onCreateAppointment={jest.fn()} onCreatePayment={jest.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('create-menu-fab-glow')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Open create menu'));
    expect(screen.getByText('New')).toBeTruthy();

    fireEvent.press(screen.getByTestId('create-menu-fab'));
    await waitFor(async () => {
      await expect(AsyncStorage.getItem(CREATE_PAYMENT_HIGHLIGHT_SEEN_KEY)).resolves.toBe('1');
    });
    expect(screen.queryByTestId('create-menu-fab-glow')).toBeNull();

    fireEvent.press(screen.getByLabelText('Open create menu'));
    expect(screen.getByLabelText('Create payment')).toBeTruthy();
    expect(screen.queryByText('New')).toBeNull();
  });
});

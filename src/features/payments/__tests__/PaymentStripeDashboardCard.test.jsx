import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { PaymentStripeDashboardCard } from '../components/PaymentStripeDashboardCard';

jest.mock('../../auth', () => ({
  useAuth: () => ({
    session: { access_token: 'jwt-token' },
  }),
}));

describe('PaymentStripeDashboardCard', () => {
  it('keeps Stripe charges collapsed until tapped', () => {
    renderWithProviders(<PaymentStripeDashboardCard stripeAccountId="acct_test" />);

    expect(screen.getByText('See your balance, payouts, and tax forms.')).toBeTruthy();
    expect(screen.getByText('Stripe charges')).toBeTruthy();
    expect(screen.queryByText('Cards')).toBeNull();
    expect(screen.queryByText('2.9% + 30¢')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Stripe charges' }));

    expect(screen.getByText('Cards')).toBeTruthy();
    expect(screen.getByText('2.9% + 30¢')).toBeTruthy();
    expect(screen.getByText('Tap to pay')).toBeTruthy();
    expect(screen.getByText('2.7% + 5¢')).toBeTruthy();
  });
});

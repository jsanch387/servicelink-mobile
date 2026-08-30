import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { PaymentStripeDashboardCard } from '../components/PaymentStripeDashboardCard';

jest.mock('../../auth', () => ({
  useAuth: () => ({
    session: { access_token: 'jwt-token' },
  }),
}));

describe('PaymentStripeDashboardCard', () => {
  it('shows Stripe card and tap-to-pay rates', () => {
    renderWithProviders(<PaymentStripeDashboardCard stripeAccountId="acct_test" />);

    expect(screen.getByText('Stripe charges')).toBeTruthy();
    expect(screen.getByText('Cards')).toBeTruthy();
    expect(screen.getByText('2.9% + 30¢')).toBeTruthy();
    expect(screen.getByText('Tap to pay')).toBeTruthy();
    expect(screen.getByText('2.7% + 5¢')).toBeTruthy();
    expect(screen.queryByLabelText('Stripe pricing')).toBeNull();
  });
});

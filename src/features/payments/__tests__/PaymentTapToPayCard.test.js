import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE } from '../../tap-to-pay/constants/tapToPayHowItWorksCopy';
import { PaymentTapToPayCard } from '../components/PaymentTapToPayCard';

describe('PaymentTapToPayCard', () => {
  it('opens the ServiceLink how-it-works sheet', () => {
    renderWithProviders(<PaymentTapToPayCard />);

    expect(screen.getByText('Tap to Pay')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'How it works' })).toBeTruthy();
    expect(screen.queryByText(TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE)).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'How it works' }));

    expect(screen.getByText(TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE)).toBeTruthy();
    expect(screen.getByText(/built into job checkout/i)).toBeTruthy();
    expect(screen.getByText(/complete screen/i)).toBeTruthy();
  });
});

import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { TapToPayTipSheet } from '../components/TapToPayTipSheet';

describe('TapToPayTipSheet', () => {
  it('charges the service total plus the selected percent', () => {
    const onContinue = jest.fn();
    renderWithProviders(
      <TapToPayTipSheet amountDueCents={8000} onClose={() => {}} onContinue={onContinue} />,
    );

    expect(screen.getByText('$80.00')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: '20 percent, $16.00' }));
    expect(screen.getByText('$96.00')).toBeTruthy();
    expect(screen.getByText('Includes a $16.00 tip.')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Charge $96.00' }));
    expect(onContinue).toHaveBeenCalledWith(1600);
  });

  it('charges the service total when the customer skips the tip', () => {
    const onContinue = jest.fn();
    renderWithProviders(
      <TapToPayTipSheet amountDueCents={8000} onClose={() => {}} onContinue={onContinue} />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'No tip' }));
    fireEvent.press(screen.getByRole('button', { name: 'Charge $80.00' }));
    expect(onContinue).toHaveBeenCalledWith(0);
  });
});

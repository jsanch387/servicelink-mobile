import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE } from '../../tap-to-pay/constants/tapToPayHowItWorksCopy';
import { PaymentTapToPayCard } from '../components/PaymentTapToPayCard';

describe('PaymentTapToPayCard', () => {
  it('shows enable CTA when not enabled', () => {
    const onEnablePress = jest.fn();
    renderWithProviders(
      <PaymentTapToPayCard
        canEnable
        checking={false}
        isEnabled={false}
        isEnabling={false}
        onEnablePress={onEnablePress}
      />,
    );

    expect(screen.getByText('Set up on iPhone.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Enable Tap to Pay' }));
    expect(onEnablePress).toHaveBeenCalledTimes(1);
  });

  it('shows enabled state and how-it-works sheet', () => {
    renderWithProviders(
      <PaymentTapToPayCard
        canEnable
        checking={false}
        isEnabled
        isEnabling={false}
        onEnablePress={jest.fn()}
      />,
    );

    expect(screen.getByText('Enabled')).toBeTruthy();
    expect(screen.getByText('Accept contactless payments.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Enable Tap to Pay' })).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'How it works' }));
    expect(screen.getByText(TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE)).toBeTruthy();
  });

  it('shows enabled pill when opted in even if reader session is cold', () => {
    renderWithProviders(
      <PaymentTapToPayCard
        canEnable
        checking={false}
        isEnabled
        isEnabling={false}
        onEnablePress={jest.fn()}
      />,
    );

    expect(screen.getByText('Enabled')).toBeTruthy();
    expect(screen.getByText('Accept contactless payments.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Enable Tap to Pay' })).toBeNull();
  });
});

import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { TapToPaySetupRequiredSheet } from '../components/TapToPaySetupRequiredSheet';
import {
  TAP_TO_PAY_NOT_SET_UP_TITLE,
  TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL,
} from '../constants/tapToPayConnectCopy';

describe('TapToPaySetupRequiredSheet', () => {
  it('calls onSetupPress when Set up payments is tapped', () => {
    const onSetupPress = jest.fn();
    renderWithProviders(
      <TapToPaySetupRequiredSheet visible onRequestClose={() => {}} onSetupPress={onSetupPress} />,
    );

    expect(screen.getByText(TAP_TO_PAY_NOT_SET_UP_TITLE)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL }));
    expect(onSetupPress).toHaveBeenCalledTimes(1);
  });
});

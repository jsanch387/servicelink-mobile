import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { TapToPaySetupRequiredSheet } from '../components/TapToPaySetupRequiredSheet';
import {
  TAP_TO_PAY_MEMBER_COMING_SOON_CTA,
  TAP_TO_PAY_MEMBER_COMING_SOON_HINT,
  TAP_TO_PAY_MEMBER_COMING_SOON_TITLE,
  TAP_TO_PAY_NOT_SET_UP_TITLE,
  TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL,
} from '../constants/tapToPayConnectCopy';

describe('TapToPaySetupRequiredSheet', () => {
  it('calls onSetupPress when Set up payments is tapped', () => {
    const onSetupPress = jest.fn();
    renderWithProviders(
      <TapToPaySetupRequiredSheet
        isMember={false}
        visible
        onRequestClose={() => {}}
        onSetupPress={onSetupPress}
      />,
    );

    expect(screen.getByText(TAP_TO_PAY_NOT_SET_UP_TITLE)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL }));
    expect(onSetupPress).toHaveBeenCalledTimes(1);
  });

  it('shows a coming-soon note for team members instead of payment setup', () => {
    const onSetupPress = jest.fn();
    const onRequestClose = jest.fn();
    renderWithProviders(
      <TapToPaySetupRequiredSheet
        isMember
        visible
        onRequestClose={onRequestClose}
        onSetupPress={onSetupPress}
      />,
    );

    expect(screen.getByText(TAP_TO_PAY_MEMBER_COMING_SOON_TITLE)).toBeTruthy();
    expect(screen.getByText(TAP_TO_PAY_MEMBER_COMING_SOON_HINT)).toBeTruthy();
    expect(screen.queryByText(TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL)).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: TAP_TO_PAY_MEMBER_COMING_SOON_CTA }));
    expect(onRequestClose).toHaveBeenCalledTimes(1);
    expect(onSetupPress).not.toHaveBeenCalled();
  });
});

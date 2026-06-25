import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE } from '../../tap-to-pay/constants/tapToPayHowItWorksCopy';
import { HelpScreen } from '../screens/HelpScreen';

jest.mock('../../tap-to-pay/constants/tapToPayFeatureFlags', () => ({
  isTapToPayPlatformSupported: jest.fn(() => true),
}));

const { isTapToPayPlatformSupported } = require('../../tap-to-pay/constants/tapToPayFeatureFlags');

describe('HelpScreen', () => {
  beforeEach(() => {
    isTapToPayPlatformSupported.mockReturnValue(true);
  });

  it('opens Tap to Pay merchant education from the help hub', () => {
    renderWithProviders(<HelpScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Tap to Pay' }));
    expect(screen.getByText(TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE)).toBeTruthy();
  });

  it('shows empty state when Tap to Pay help is unavailable on this device', () => {
    isTapToPayPlatformSupported.mockReturnValue(false);
    renderWithProviders(<HelpScreen />);

    expect(screen.getByText('More guides coming soon.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tap to Pay' })).toBeNull();
  });
});

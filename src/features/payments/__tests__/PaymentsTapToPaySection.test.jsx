import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { PaymentsTapToPaySection } from '../components/PaymentsTapToPaySection';

jest.mock('../../tap-to-pay/constants/tapToPayFeatureFlags', () => ({
  isTapToPayPlatformSupported: jest.fn(() => true),
}));

jest.mock('../../tap-to-pay/hooks/useTapToPayEnablement', () => ({
  useTapToPayEnablement: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => {
    callback();
  }),
}));

const { useTapToPayEnablement } = require('../../tap-to-pay/hooks/useTapToPayEnablement');

describe('PaymentsTapToPaySection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows Enabled pill when merchant opted in without requiring reader warm', async () => {
    useTapToPayEnablement.mockReturnValue({
      canEnable: true,
      checking: false,
      enable: jest.fn(),
      isEnabled: true,
      isEnabling: false,
      needsReconnect: true,
      refresh: jest.fn(),
    });

    renderWithProviders(<PaymentsTapToPaySection />);

    expect(screen.getByText('Enabled')).toBeTruthy();
    expect(screen.getByText('Accept contactless payments.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Enable Tap to Pay' })).toBeNull();
  });

  it('shows Enable CTA when merchant has not opted in', async () => {
    const enable = jest.fn().mockResolvedValue(true);
    useTapToPayEnablement.mockReturnValue({
      canEnable: true,
      checking: false,
      enable,
      isEnabled: false,
      isEnabling: false,
      needsReconnect: false,
      refresh: jest.fn(),
    });

    renderWithProviders(<PaymentsTapToPaySection />);

    fireEvent.press(screen.getByRole('button', { name: 'Enable Tap to Pay' }));
    expect(enable).toHaveBeenCalledTimes(1);
  });

  it('returns null on unsupported platforms', () => {
    const {
      isTapToPayPlatformSupported,
    } = require('../../tap-to-pay/constants/tapToPayFeatureFlags');
    isTapToPayPlatformSupported.mockReturnValue(false);

    renderWithProviders(<PaymentsTapToPaySection />);

    expect(screen.queryByText('Tap to Pay')).toBeNull();
  });
});

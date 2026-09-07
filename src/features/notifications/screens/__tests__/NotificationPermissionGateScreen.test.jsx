import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import { NOTIFICATION_PERMISSION_ENABLE_LABEL } from '../../constants/notificationPermissionCopy';
import { NotificationPermissionGateScreen } from '../NotificationPermissionGateScreen';

const mockCompletePrimer = jest.fn(() => Promise.resolve());
const mockRequestPushPermissionAndRegister = jest.fn(() => Promise.resolve({ ok: true }));

jest.mock('../../context/NotificationPermissionPrimerGateContext', () => ({
  useNotificationPermissionPrimerGate: () => ({
    needsPrimer: true,
    isPrimerReady: true,
    completePrimer: (...args) => mockCompletePrimer(...args),
  }),
}));

jest.mock('../../../auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('../../utils/registerPushDeviceToken', () => ({
  requestPushPermissionAndRegister: (...args) => mockRequestPushPermissionAndRegister(...args),
}));

describe('NotificationPermissionGateScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests permission then continues on Turn on notifications', async () => {
    renderWithProviders(<NotificationPermissionGateScreen />);

    fireEvent.press(screen.getByLabelText(NOTIFICATION_PERMISSION_ENABLE_LABEL));

    await waitFor(() => {
      expect(mockRequestPushPermissionAndRegister).toHaveBeenCalledWith('user-1');
      expect(mockCompletePrimer).toHaveBeenCalled();
    });
  });

  it('continues without prompting on Not now', async () => {
    renderWithProviders(<NotificationPermissionGateScreen />);

    fireEvent.press(screen.getByLabelText('Not now'));

    await waitFor(() => {
      expect(mockCompletePrimer).toHaveBeenCalled();
    });
    expect(mockRequestPushPermissionAndRegister).not.toHaveBeenCalled();
  });
});

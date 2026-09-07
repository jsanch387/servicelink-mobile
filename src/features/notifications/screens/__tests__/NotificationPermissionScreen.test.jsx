import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import {
  NOTIFICATION_PERMISSION_BODY,
  NOTIFICATION_PERMISSION_ENABLE_LABEL,
  NOTIFICATION_PERMISSION_SKIP_LABEL,
  NOTIFICATION_PERMISSION_TITLE,
} from '../../constants/notificationPermissionCopy';
import { NotificationPermissionScreen } from '../NotificationPermissionScreen';

describe('NotificationPermissionScreen', () => {
  it('shows the primer copy and actions', () => {
    renderWithProviders(<NotificationPermissionScreen />);

    expect(screen.getByTestId('notification-permission-screen')).toBeTruthy();
    expect(screen.getByText(NOTIFICATION_PERMISSION_TITLE)).toBeTruthy();
    expect(screen.getByText(NOTIFICATION_PERMISSION_BODY)).toBeTruthy();
    expect(screen.getByText('New appointment')).toBeTruthy();
    expect(screen.getByText('Sarah booked Friday at 2:00 PM')).toBeTruthy();
    expect(screen.getByText('New quote')).toBeTruthy();
    expect(screen.getByText('Jordan requested a quote')).toBeTruthy();
    expect(screen.getByLabelText(NOTIFICATION_PERMISSION_ENABLE_LABEL)).toBeTruthy();
    expect(screen.getByLabelText(NOTIFICATION_PERMISSION_SKIP_LABEL)).toBeTruthy();
  });

  it('calls enable and skip when those actions are provided', () => {
    const onEnable = jest.fn();
    const onSkip = jest.fn();
    renderWithProviders(<NotificationPermissionScreen onEnable={onEnable} onSkip={onSkip} />);

    fireEvent.press(screen.getByLabelText(NOTIFICATION_PERMISSION_ENABLE_LABEL));
    fireEvent.press(screen.getByLabelText(NOTIFICATION_PERMISSION_SKIP_LABEL));

    expect(onEnable).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

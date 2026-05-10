import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { NotificationsInboxScreen } from '../NotificationsInboxScreen';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import { ROUTES } from '../../../../routes/routes';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../../../auth', () => ({
  useAuth: () => ({
    user: { id: 'user-inbox-1' },
    session: { access_token: 'test-token' },
  }),
}));

jest.mock('../../api/fetchNotificationsInbox', () => ({
  NOTIFICATIONS_UNREAD_LIMIT: 40,
  NOTIFICATIONS_RECENT_PAGE_SIZE: 25,
  fetchUnreadNotificationsInbox: jest.fn(),
  fetchRecentNotificationsPage: jest.fn(),
}));

jest.mock('../../api/fetchNotificationUnreadCount', () => ({
  fetchNotificationUnreadCount: jest.fn(),
}));

jest.mock('../../api/markNotificationRead', () => ({
  markNotificationRead: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../api/markAllNotificationsRead', () => ({
  markAllNotificationsRead: jest.fn(() => Promise.resolve()),
}));

import {
  fetchRecentNotificationsPage,
  fetchUnreadNotificationsInbox,
} from '../../api/fetchNotificationsInbox';
import { fetchNotificationUnreadCount } from '../../api/fetchNotificationUnreadCount';
import { markNotificationRead } from '../../api/markNotificationRead';

function inboxItem(overrides = {}) {
  return {
    id: 'n-1',
    type: 'booking',
    displayTitle: 'New appointment',
    subtitle: 'From Alex',
    title: 'Raw title',
    body: '',
    time: '2m',
    unread: true,
    referenceType: 'booking',
    referenceId: 'booking-uuid-1',
    metadata: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('NotificationsInboxScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchNotificationUnreadCount.mockResolvedValue(0);
    fetchUnreadNotificationsInbox.mockResolvedValue([]);
    fetchRecentNotificationsPage.mockResolvedValue([]);
  });

  it('shows loading skeleton while unread query is pending', async () => {
    fetchUnreadNotificationsInbox.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<NotificationsInboxScreen />);

    expect(await screen.findByLabelText('Loading notifications')).toBeTruthy();
  });

  it('shows generic empty copy on New tab when there are no unread items', async () => {
    renderWithProviders(<NotificationsInboxScreen />);

    expect(await screen.findByText('All caught up')).toBeTruthy();
    expect(
      screen.getByText('When something new needs your attention, it will show up here.'),
    ).toBeTruthy();
  });

  it('shows Recent empty copy after switching to Recent', async () => {
    renderWithProviders(<NotificationsInboxScreen />);

    await screen.findByText('All caught up');

    fireEvent.press(screen.getByRole('tab', { name: 'Recent' }));

    expect(await screen.findByText('No activity yet')).toBeTruthy();
    expect(
      screen.getByText('When you receive notifications, the most recent ones will appear here.'),
    ).toBeTruthy();
  });

  it('renders unread rows and opens target after press', async () => {
    fetchUnreadNotificationsInbox.mockResolvedValue([inboxItem()]);
    fetchNotificationUnreadCount.mockResolvedValue(1);

    renderWithProviders(<NotificationsInboxScreen />);

    expect(await screen.findByText('New appointment')).toBeTruthy();
    expect(screen.getByText('From Alex')).toBeTruthy();

    fireEvent.press(screen.getByLabelText(/New appointment/));

    await waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith('user-inbox-1', 'n-1');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MAIN_APP, {
        screen: ROUTES.BOOKINGS,
        params: {
          screen: ROUTES.BOOKING_DETAILS,
          params: { bookingId: 'booking-uuid-1' },
        },
      });
    });
  });

  it('groups Recent by Today and Older using local calendar', async () => {
    const today = new Date();
    const olderDate = new Date(today);
    olderDate.setDate(olderDate.getDate() - 4);

    fetchRecentNotificationsPage.mockResolvedValue([
      inboxItem({
        id: 'recent-1',
        displayTitle: 'Today item',
        createdAt: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          10,
          0,
          0,
        ).toISOString(),
        unread: false,
      }),
      inboxItem({
        id: 'recent-2',
        displayTitle: 'Older item',
        createdAt: olderDate.toISOString(),
        unread: false,
      }),
    ]);

    renderWithProviders(<NotificationsInboxScreen />);

    await screen.findByText('All caught up');

    fireEvent.press(screen.getByRole('tab', { name: 'Recent' }));

    expect(await screen.findByText('Today')).toBeTruthy();
    expect(screen.getByText('Today item')).toBeTruthy();
    expect(screen.getByText('Older')).toBeTruthy();
    expect(screen.getByText('Older item')).toBeTruthy();
  });

  it('disables Mark all read when unread count is zero', async () => {
    fetchNotificationUnreadCount.mockResolvedValue(0);
    renderWithProviders(<NotificationsInboxScreen />);

    await screen.findByText('All caught up');

    const markAll = screen.getByLabelText('Mark all as read');
    expect(markAll.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows error with Try again when fetch fails, then recovers after retry', async () => {
    fetchUnreadNotificationsInbox
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce([]);

    renderWithProviders(<NotificationsInboxScreen />);

    expect(await screen.findByText(/Can't connect right now/i)).toBeTruthy();
    expect(screen.getByLabelText('Try again')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Try again'));

    expect(await screen.findByText('All caught up')).toBeTruthy();
  });
});

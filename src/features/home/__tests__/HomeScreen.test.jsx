import { Alert } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { ROUTES } from '../../../routes/routes';
import { renderWithProviders } from './testUtils';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 0,
}));

jest.mock('@react-navigation/native', () => {
  const R = require('react');
  return {
    useFocusEffect: (cb) => {
      R.useEffect(() => cb(), []);
    },
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

jest.mock('../hooks/useHomeDashboard', () => ({
  useHomeDashboard: jest.fn(),
}));

jest.mock('../../notifications/hooks/useNotificationUnreadCount', () => ({
  useNotificationUnreadCount: () => ({ unreadCount: 0 }),
}));

const mockUseSubscription = jest.fn(() => ({
  hasProAccess: true,
  isOwnerProfileLoaded: true,
}));

jest.mock('../../subscription', () => ({
  useSubscription: (...args) => mockUseSubscription(...args),
}));

const mockUseBookingsFreeTierUsage = jest.fn(() => ({
  used: 0,
  limit: 5,
  isLoading: false,
  isError: false,
}));

jest.mock('../../bookings/hooks/useBookingsFreeTierUsage', () => ({
  useBookingsFreeTierUsage: (...args) => mockUseBookingsFreeTierUsage(...args),
}));

const mockUseHomeDashboard = useHomeDashboard;

function baseDashboard(overrides = {}) {
  return {
    business: { id: 'b1', business_slug: 'acme', profile_views: 12, free_bookings_count: null },
    businessError: null,
    bookingsError: null,
    todayBookingsError: null,
    nextBooking: null,
    upcomingCount: 0,
    nextSubtitle: '',
    spotlightMode: 'none',
    todayTimelineItems: [],
    isPendingBusiness: false,
    isPendingBookings: false,
    isPendingTodayBookings: false,
    isLoading: false,
    isFetching: false,
    refetch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseHomeDashboard.mockReturnValue(baseDashboard());
    mockUseBookingsFreeTierUsage.mockReturnValue({
      used: 0,
      limit: 5,
      isLoading: false,
      isError: false,
    });
  });

  it('renders section labels, link stats, and empty today timeline when loaded', () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('Booking link')).toBeTruthy();
    expect(screen.getByText('Next Up')).toBeTruthy();
    expect(screen.getByText("Today's timeline")).toBeTruthy();
    expect(screen.getByText('Nothing on the calendar')).toBeTruthy();
    expect(screen.getByText('Views')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('does not show free-tier upgrade UI for Pro users', () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.queryByLabelText('Upgrade to Pro')).toBeNull();
    expect(screen.queryByText(/free bookings/i)).toBeNull();
  });

  it('lets Pro users open create appointment and create quote from the FAB without a limit alert', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    try {
      renderWithProviders(<HomeScreen />);
      fireEvent.press(screen.getByLabelText('Open create menu'));
      fireEvent.press(screen.getByLabelText('Create appointment'));
      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CREATE_APPOINTMENT);
      mockNavigate.mockClear();
      fireEvent.press(screen.getByLabelText('Open create menu'));
      fireEvent.press(screen.getByLabelText('Create quote'));
      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CREATE_QUOTE);
    } finally {
      alertSpy.mockRestore();
    }
  });

  it('shows today timeline rows when there is at least one item for today', () => {
    mockUseHomeDashboard.mockReturnValue(
      baseDashboard({
        todayTimelineItems: [
          { id: 't1', time: '9:00 AM', title: 'Detail', statusKind: 'scheduled' },
        ],
      }),
    );
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText("Today's timeline")).toBeTruthy();
    expect(screen.getByText('9:00 AM')).toBeTruthy();
  });

  it('uses In progress as the spotlight section title when a visit is underway', () => {
    mockUseHomeDashboard.mockReturnValue(
      baseDashboard({
        spotlightMode: 'in_progress',
        nextBooking: {
          id: 'b1',
          customer_name: 'Alex',
          service_name: 'Detail',
          customer_phone: '5552345678',
          customer_street_address: '1 Main',
          customer_city: 'Austin',
          customer_state: 'TX',
          customer_zip: '78701',
        },
        nextSubtitle: 'Started at 2:00 PM',
      }),
    );
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(screen.queryByText('Next Up')).toBeNull();
  });

  it('navigates to account when Pro upgrade nudge is pressed for non‑Pro users', () => {
    mockUseSubscription.mockReturnValueOnce({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });
    renderWithProviders(<HomeScreen />);
    fireEvent.press(screen.getByLabelText('Upgrade to Pro'));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MORE, { screen: ROUTES.ACCOUNT_SETTINGS });
  });

  it('shows Pro upgrade nudge in free booking cap mode when at the limit', () => {
    mockUseSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });
    mockUseBookingsFreeTierUsage.mockReturnValue({
      used: 5,
      limit: 5,
      isLoading: false,
      isError: false,
    });
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('5 / 5 free bookings')).toBeTruthy();
    expect(screen.getByText('Upgrade to Pro for unlimited bookings')).toBeTruthy();
    expect(screen.queryByLabelText('Upgrade to Pro')).toBeNull();
  });

  it('prefers business_profiles.free_bookings_count over head-count for cap UI', () => {
    mockUseSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });
    mockUseBookingsFreeTierUsage.mockReturnValue({
      used: 0,
      limit: 5,
      isLoading: false,
      isError: false,
    });
    mockUseHomeDashboard.mockReturnValue(
      baseDashboard({
        business: {
          id: 'b1',
          business_slug: 'acme',
          profile_views: 0,
          free_bookings_count: 5,
        },
      }),
    );
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('5 / 5 free bookings')).toBeTruthy();
  });

  it('navigates to account when free booking cap nudge is pressed', () => {
    mockUseSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });
    mockUseBookingsFreeTierUsage.mockReturnValue({
      used: 5,
      limit: 5,
      isLoading: false,
      isError: false,
    });
    renderWithProviders(<HomeScreen />);
    fireEvent.press(
      screen.getByLabelText(
        'Free plan: 5 of 5 bookings used. Upgrade to Pro for unlimited bookings.',
      ),
    );
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MORE, { screen: ROUTES.ACCOUNT_SETTINGS });
  });

  it('blocks create appointment when free_bookings_count from profile is at the cap', () => {
    mockUseSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });
    mockUseBookingsFreeTierUsage.mockReturnValue({
      used: 0,
      limit: 5,
      isLoading: false,
      isError: false,
    });
    mockUseHomeDashboard.mockReturnValue(
      baseDashboard({
        business: {
          id: 'b1',
          business_slug: 'acme',
          profile_views: 0,
          free_bookings_count: 5,
        },
      }),
    );
    const alertSpy = jest.spyOn(Alert, 'alert');
    try {
      renderWithProviders(<HomeScreen />);
      fireEvent.press(screen.getByLabelText('Open create menu'));
      fireEvent.press(screen.getByLabelText('Create appointment'));
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalled();
    } finally {
      alertSpy.mockRestore();
    }
  });

  it('navigates to notifications inbox when bell is pressed', () => {
    renderWithProviders(<HomeScreen />);
    fireEvent.press(screen.getByLabelText('Notifications'));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.NOTIFICATIONS_INBOX);
  });

  it('navigates to create appointment when FAB menu appointment is pressed', () => {
    renderWithProviders(<HomeScreen />);
    fireEvent.press(screen.getByLabelText('Open create menu'));
    fireEvent.press(screen.getByLabelText('Create appointment'));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CREATE_APPOINTMENT);
  });

  it('blocks create appointment from FAB when free plan is at the booking limit', () => {
    mockUseSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });
    mockUseBookingsFreeTierUsage.mockReturnValue({
      used: 5,
      limit: 5,
      isLoading: false,
      isError: false,
    });
    const alertSpy = jest.spyOn(Alert, 'alert');
    try {
      renderWithProviders(<HomeScreen />);
      fireEvent.press(screen.getByLabelText('Open create menu'));
      fireEvent.press(screen.getByLabelText('Create appointment'));
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalled();
      const [, , buttons] = alertSpy.mock.calls[0];
      const upgrade = buttons.find((b) => b.text === 'Upgrade');
      expect(upgrade).toBeTruthy();
      upgrade.onPress();
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MORE, { screen: ROUTES.ACCOUNT_SETTINGS });
    } finally {
      alertSpy.mockRestore();
    }
  });

  it('allows create appointment from FAB when free plan is under the booking limit', () => {
    mockUseSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });
    mockUseBookingsFreeTierUsage.mockReturnValue({
      used: 4,
      limit: 5,
      isLoading: false,
      isError: false,
    });
    renderWithProviders(<HomeScreen />);
    fireEvent.press(screen.getByLabelText('Open create menu'));
    fireEvent.press(screen.getByLabelText('Create appointment'));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CREATE_APPOINTMENT);
  });

  it('blocks create quote from FAB when free plan is at the booking limit', () => {
    mockUseSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });
    mockUseBookingsFreeTierUsage.mockReturnValue({
      used: 5,
      limit: 5,
      isLoading: false,
      isError: false,
    });
    const alertSpy = jest.spyOn(Alert, 'alert');
    try {
      renderWithProviders(<HomeScreen />);
      fireEvent.press(screen.getByLabelText('Open create menu'));
      fireEvent.press(screen.getByLabelText('Create quote'));
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalled();
      expect(alertSpy.mock.calls[0][0]).toBe('Free plan limit reached');
    } finally {
      alertSpy.mockRestore();
    }
  });

  it('navigates to create quote when FAB menu quote is pressed', () => {
    renderWithProviders(<HomeScreen />);
    fireEvent.press(screen.getByLabelText('Open create menu'));
    fireEvent.press(screen.getByLabelText('Create quote'));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CREATE_QUOTE);
  });
});

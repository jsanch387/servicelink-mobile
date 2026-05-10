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

const mockUseHomeDashboard = useHomeDashboard;

function baseDashboard(overrides = {}) {
  return {
    business: { id: 'b1', business_slug: 'acme', profile_views: 12 },
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
  });

  it('renders section labels and link stats when loaded', () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('Booking link')).toBeTruthy();
    expect(screen.getByText('Next Up')).toBeTruthy();
    expect(screen.getByText('Rest of Today')).toBeTruthy();
    expect(screen.getByText('Views')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('uses In progress as the spotlight section title when a visit is underway', () => {
    mockUseHomeDashboard.mockReturnValue(
      baseDashboard({
        spotlightMode: 'in_progress',
        nextBooking: {
          id: 'b1',
          customer_name: 'Alex',
          service_name: 'Detail',
          customer_phone: '5551234567',
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

  it('navigates to create quote when FAB menu quote is pressed', () => {
    renderWithProviders(<HomeScreen />);
    fireEvent.press(screen.getByLabelText('Open create menu'));
    fireEvent.press(screen.getByLabelText('Create quote'));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CREATE_QUOTE);
  });
});

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
    nextBookingTitle: '',
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

  it('shows Updating when background refetch runs with cached content', () => {
    mockUseHomeDashboard.mockReturnValue(
      baseDashboard({
        isFetching: true,
        isLoading: false,
      }),
    );
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('Updating…')).toBeTruthy();
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

  it('does not show Updating during initial load', () => {
    mockUseHomeDashboard.mockReturnValue(
      baseDashboard({
        isPendingBusiness: true,
        isLoading: true,
        isFetching: true,
      }),
    );
    renderWithProviders(<HomeScreen />);
    expect(screen.queryByText('Updating…')).toBeNull();
  });
});

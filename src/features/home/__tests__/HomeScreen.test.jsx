import { Alert } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useLinkViewsAnalytics } from '../hooks/useLinkViewsAnalytics';
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

jest.mock('../hooks/useLinkViewsAnalytics', () => ({
  useLinkViewsAnalytics: jest.fn(),
}));

jest.mock('../../bookings/hooks/useBookingAction', () => ({
  useBookingAction: () => ({
    notifyOnTheWay: jest.fn(),
    isSending: false,
    disabled: false,
    isOnTheWayDone: () => false,
  }),
}));

jest.mock('../../notifications/hooks/useNotificationUnreadCount', () => ({
  useNotificationUnreadCount: () => ({ unreadCount: 0 }),
}));

const mockUseSubscription = jest.fn(() => ({
  hasProAccess: true,
  isOwnerProfileLoaded: true,
}));

const mockShowWebAccountFeatureAlert = jest.fn();

jest.mock('../../subscription', () => ({
  useSubscription: (...args) => mockUseSubscription(...args),
  showWebAccountFeatureAlert: (...args) => mockShowWebAccountFeatureAlert(...args),
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

const mockMarkCompleteFlow = {
  sheetVisible: false,
  openSheet: jest.fn(),
  closeSheet: jest.fn(),
  preview: null,
  completeVisitModel: null,
  useCompleteVisitScreen: true,
  isLoadingPreview: false,
  previewError: null,
  confirmComplete: jest.fn(),
  isConfirming: false,
  confirmError: null,
};

jest.mock('../../bookings/booking-details/hooks/useMarkBookingCompleteFlow', () => ({
  useMarkBookingCompleteFlow: jest.fn(() => mockMarkCompleteFlow),
}));

jest.mock('../../bookings/booking-details/components/BookingCompleteInvoiceDesignSheet', () => ({
  BookingCompleteVisitSheet: () => null,
  BookingCompleteInvoiceDesignSheet: () => null,
}));

jest.mock('../../bookings/booking-details/components/BookingMarkCompleteSheet', () => ({
  BookingMarkCompleteSheet: () => null,
}));

const mockUseHomeDashboard = useHomeDashboard;
const mockUseLinkViewsAnalytics = useLinkViewsAnalytics;

function baseLinkViews(overrides = {}) {
  return {
    views: 12,
    lastViewedAt: '2026-05-20T10:00:00.000Z',
    period: '24h',
    effectivePeriod: '24h',
    onPeriodChange: jest.fn(),
    isPendingViews: false,
    isPendingLastVisit: false,
    viewsError: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function baseDashboard(overrides = {}) {
  return {
    business: { id: 'b1', business_slug: 'acme', free_bookings_count: null },
    businessError: null,
    bookingsError: null,
    todayBookingsError: null,
    nextBooking: null,
    upcomingCount: 0,
    nextSubtitle: '',
    spotlightMode: 'none',
    todayTimelineItems: [],
    todaysEarnings: {
      jobCount: 0,
      potentialCents: 0,
      collectedCents: 0,
      remainingCents: 0,
    },
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
    mockShowWebAccountFeatureAlert.mockClear();
    mockUseHomeDashboard.mockReturnValue(baseDashboard());
    mockUseLinkViewsAnalytics.mockReturnValue(baseLinkViews());
    mockUseBookingsFreeTierUsage.mockReturnValue({
      used: 0,
      limit: 5,
      isLoading: false,
      isError: false,
    });
  });

  it('renders section labels, link stats, and empty today timeline when loaded', () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('Link visits')).toBeTruthy();
    expect(screen.getByText('Next Up')).toBeTruthy();
    expect(screen.getByText("Today's timeline")).toBeTruthy();
    expect(screen.getByText('Nothing on the calendar')).toBeTruthy();
    expect(screen.getByText('Last 24 hours')).toBeTruthy();
    expect(screen.getByText('24 hours')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('shows live earnings only when priced jobs are scheduled today', () => {
    mockUseHomeDashboard.mockReturnValue(
      baseDashboard({
        todaysEarnings: {
          jobCount: 2,
          potentialCents: 40000,
          collectedCents: 20000,
          remainingCents: 20000,
        },
      }),
    );

    renderWithProviders(<HomeScreen />);

    expect(screen.getByText("Today's earnings")).toBeTruthy();
    expect(screen.getByText('$400')).toBeTruthy();
    expect(screen.getAllByText('$200')).toHaveLength(2);
  });

  it('hides earnings when there are no priced jobs today', () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.queryByText("Today's earnings")).toBeNull();
  });

  it('shows today timeline section while business is still loading', () => {
    mockUseHomeDashboard.mockReturnValue(
      baseDashboard({
        business: null,
        isPendingBusiness: true,
        isPendingBookings: true,
        isLoading: true,
      }),
    );
    renderWithProviders(<HomeScreen />);
    expect(screen.getByLabelText('Loading business name')).toBeTruthy();
    expect(screen.queryByText('Your business')).toBeNull();
    expect(screen.getByText("Today's earnings")).toBeTruthy();
    expect(screen.getByLabelText("Loading today's earnings")).toBeTruthy();
    expect(screen.getByText("Today's timeline")).toBeTruthy();
    expect(screen.queryByText('Nothing on the calendar')).toBeNull();
  });

  it('keeps long business names inside the header space', () => {
    const longName = 'Black Label Premium Mobile Auto Detailing and Ceramic Coatings';
    mockUseHomeDashboard.mockReturnValue(
      baseDashboard({
        business: {
          id: 'b1',
          business_name: longName,
          business_slug: 'black-label',
          free_bookings_count: null,
        },
      }),
    );

    renderWithProviders(<HomeScreen />);

    const name = screen.getByText(longName);
    expect(name.props.adjustsFontSizeToFit).toBe(true);
    expect(name.props.minimumFontScale).toBe(0.68);
    expect(name.props.numberOfLines).toBe(1);
  });

  it('does not show free-tier booking usage for Pro users', () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.queryByLabelText(/Bookings used:/)).toBeNull();
    expect(screen.queryByText('Upgrade to Pro')).toBeNull();
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

  it('keeps Next Up as the section title while lifecycle actions are on hold', () => {
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
    expect(screen.getByText('Next Up')).toBeTruthy();
    expect(screen.getByLabelText(/In progress.*Alex/i)).toBeTruthy();
  });

  it('shows free bookings usage card for non-Pro users', () => {
    mockUseSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });
    mockUseBookingsFreeTierUsage.mockReturnValue({
      used: 3,
      limit: 5,
      isLoading: false,
      isError: false,
    });
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('Bookings used')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('/ 5')).toBeTruthy();
    expect(screen.getByLabelText('Bookings used: 3 of 5.')).toBeTruthy();
    expect(screen.queryByText('Upgrade to Pro')).toBeNull();
  });

  it('shows limit reached on usage card when at the cap', () => {
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
    expect(screen.getByLabelText('Bookings used: 5 of 5.')).toBeTruthy();
    expect(screen.queryByText('Upgrade to Pro')).toBeNull();
  });

  it('prefers business_profiles.free_bookings_count over head-count for usage card', () => {
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
          free_bookings_count: 5,
        },
      }),
    );
    renderWithProviders(<HomeScreen />);
    expect(screen.getByLabelText('Bookings used: 5 of 5.')).toBeTruthy();
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
          free_bookings_count: 5,
        },
      }),
    );
    renderWithProviders(<HomeScreen />);
    fireEvent.press(screen.getByLabelText('Open create menu'));
    fireEvent.press(screen.getByLabelText('Create appointment'));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockShowWebAccountFeatureAlert).toHaveBeenCalled();
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
    renderWithProviders(<HomeScreen />);
    fireEvent.press(screen.getByLabelText('Open create menu'));
    fireEvent.press(screen.getByLabelText('Create appointment'));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockShowWebAccountFeatureAlert).toHaveBeenCalledWith({
      title: 'Booking limit reached',
      message: expect.stringContaining('sign in on the ServiceLink website'),
    });
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
    renderWithProviders(<HomeScreen />);
    fireEvent.press(screen.getByLabelText('Open create menu'));
    fireEvent.press(screen.getByLabelText('Create quote'));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockShowWebAccountFeatureAlert).toHaveBeenCalledWith({
      title: 'Booking limit reached',
      message: expect.stringContaining('sign in on the ServiceLink website'),
    });
  });

  it('navigates to create quote when FAB menu quote is pressed', () => {
    renderWithProviders(<HomeScreen />);
    fireEvent.press(screen.getByLabelText('Open create menu'));
    fireEvent.press(screen.getByLabelText('Create quote'));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CREATE_QUOTE);
  });
});

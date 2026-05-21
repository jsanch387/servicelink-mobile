import { fireEvent, screen } from '@testing-library/react-native';
import { BookingsScreen } from '../screens/BookingsScreen';
import { useBookingsList } from '../hooks/useBookingsList';
import {
  BOOKINGS_FILTER_CANCELLED,
  BOOKINGS_FILTER_PAST,
  BOOKINGS_FILTER_UPCOMING,
} from '../constants';
import { renderWithProviders } from '../../home/__tests__/testUtils';

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

jest.mock('../hooks/useBookingsList', () => ({
  useBookingsList: jest.fn(),
}));

jest.mock('../hooks/useBookingsPlannerDay', () => ({
  useBookingsPlannerDay: jest.fn(() => ({
    business: { id: 'b1' },
    businessError: null,
    dayError: null,
    bookings: [],
    isLoading: false,
    isDayPending: false,
    isFetching: false,
    refetch: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../hooks/useBookingsCalendarCounts', () => ({
  useBookingsCalendarCounts: jest.fn(() => ({
    business: { id: 'b1' },
    businessError: null,
    countsError: null,
    bookingCountByDateKey: {},
    isLoading: false,
    isFetching: false,
    refetch: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../subscription', () => ({
  useSubscription: jest.fn(() => ({
    hasProAccess: true,
    isOwnerProfileLoaded: true,
  })),
}));

jest.mock('../hooks/useBookingsFreeTierUsage', () => ({
  useBookingsFreeTierUsage: jest.fn(() => ({
    used: 2,
    limit: 5,
    isLoading: false,
    isError: false,
  })),
}));

const { useSubscription } = require('../../subscription');
const { useBookingsFreeTierUsage } = require('../hooks/useBookingsFreeTierUsage');

const mockUseBookingsList = useBookingsList;

function baseList(overrides = {}) {
  return {
    business: { id: 'b1' },
    businessError: null,
    listError: null,
    bookings: [],
    listFilter: BOOKINGS_FILTER_UPCOMING,
    setListFilter: jest.fn(),
    isPendingBusiness: false,
    isPendingList: false,
    isLoading: false,
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    loadMoreLabel: '',
    loadMore: jest.fn(),
    loadMorePresentation: 'button',
    refetch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('BookingsScreen list empty states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBookingsList.mockReturnValue(baseList());
    useSubscription.mockReturnValue({
      hasProAccess: true,
      isOwnerProfileLoaded: true,
    });
    useBookingsFreeTierUsage.mockReturnValue({
      used: 2,
      limit: 5,
      isLoading: false,
      isError: false,
    });
  });

  it('does not show the free plan usage strip for Pro users', () => {
    renderWithProviders(<BookingsScreen />);
    expect(screen.queryByLabelText(/Free plan:/i)).toBeNull();
  });

  it('shows upcoming empty copy when there are no upcoming bookings', () => {
    renderWithProviders(<BookingsScreen />);
    expect(screen.getByText('No upcoming appointments')).toBeTruthy();
    expect(
      screen.getByText(/Confirmed visits from today onward that have not started yet show here/i),
    ).toBeTruthy();
  });

  it('shows past empty copy on the Past tab', () => {
    mockUseBookingsList.mockReturnValue(baseList({ listFilter: BOOKINGS_FILTER_PAST }));
    renderWithProviders(<BookingsScreen />);
    expect(screen.getByText('No past appointments')).toBeTruthy();
    expect(
      screen.getByText(
        /Confirmed or completed appointments that ended before the current date and time show here/i,
      ),
    ).toBeTruthy();
  });

  it('shows canceled empty copy on the Canceled tab', () => {
    mockUseBookingsList.mockReturnValue(baseList({ listFilter: BOOKINGS_FILTER_CANCELLED }));
    renderWithProviders(<BookingsScreen />);
    expect(screen.getByText('No canceled appointments')).toBeTruthy();
    expect(screen.getByText(/Canceled appointments appear here, most recent first/i)).toBeTruthy();
  });

  it('shows no-business empty copy when there is no business profile', () => {
    mockUseBookingsList.mockReturnValue(
      baseList({
        business: null,
        listError: null,
        businessError: null,
      }),
    );
    renderWithProviders(<BookingsScreen />);
    expect(screen.getByText('No business profile')).toBeTruthy();
    expect(
      screen.getByText(/Once your business is set up in ServiceLink, appointments will show here/i),
    ).toBeTruthy();
  });

  it('shows free plan booking usage when the owner is not on Pro', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });
    useBookingsFreeTierUsage.mockReturnValue({
      used: 2,
      limit: 5,
      isLoading: false,
      isError: false,
    });
    renderWithProviders(<BookingsScreen />);
    expect(screen.getByLabelText('Bookings used: 2 of 5.')).toBeTruthy();
    expect(screen.queryByLabelText('Upgrade')).toBeNull();
  });

  it('prefers business_profiles.free_bookings_count for the usage strip when set', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });
    mockUseBookingsList.mockReturnValue(
      baseList({
        business: { id: 'b1', free_bookings_count: 5 },
      }),
    );
    useBookingsFreeTierUsage.mockReturnValue({
      used: 0,
      limit: 5,
      isLoading: false,
      isError: false,
    });
    renderWithProviders(<BookingsScreen />);
    expect(screen.getByLabelText('Bookings used: 5 of 5.')).toBeTruthy();
  });

  it('shows profile booking count when head-count query errors but free_bookings_count exists', () => {
    useSubscription.mockReturnValue({
      hasProAccess: false,
      isOwnerProfileLoaded: true,
    });
    mockUseBookingsList.mockReturnValue(
      baseList({
        business: { id: 'b1', free_bookings_count: 4 },
      }),
    );
    useBookingsFreeTierUsage.mockReturnValue({
      used: undefined,
      limit: 5,
      isLoading: false,
      isError: true,
    });
    renderWithProviders(<BookingsScreen />);
    expect(screen.getByLabelText('Bookings used: 4 of 5.')).toBeTruthy();
  });

  it('requests Past filter when the Past tab is pressed', () => {
    const setListFilter = jest.fn();
    mockUseBookingsList.mockReturnValue(baseList({ setListFilter }));
    renderWithProviders(<BookingsScreen />);
    fireEvent.press(screen.getByLabelText('Past appointments'));
    expect(setListFilter).toHaveBeenCalledWith(BOOKINGS_FILTER_PAST);
  });

  it('shows calendar granularity tabs after switching to calendar view', () => {
    renderWithProviders(<BookingsScreen />);
    fireEvent.press(screen.getByLabelText('Calendar view'));
    expect(screen.getByLabelText('Day calendar view')).toBeTruthy();
    expect(screen.getByLabelText('Week calendar view')).toBeTruthy();
    expect(screen.getByLabelText('Month calendar view')).toBeTruthy();
    expect(screen.queryByLabelText('Upcoming appointments')).toBeNull();
  });
});

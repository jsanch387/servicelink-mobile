import { fireEvent, screen } from '@testing-library/react-native';
import { BookingsScreen } from '../screens/BookingsScreen';
import { useBookingsList } from '../hooks/useBookingsList';
import {
  BOOKINGS_FILTER_CANCELLED,
  BOOKINGS_FILTER_PAST,
  BOOKINGS_FILTER_UPCOMING,
} from '../constants';
import { renderWithProviders } from '../../home/__tests__/testUtils';

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 0,
}));

jest.mock('@react-navigation/native', () => {
  const R = require('react');
  return {
    useFocusEffect: (cb) => {
      R.useEffect(() => cb(), []);
    },
    useNavigation: () => ({ navigate: jest.fn() }),
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
    isFetching: false,
    refetch: jest.fn().mockResolvedValue(undefined),
  })),
}));

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
    refetch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('BookingsScreen list empty states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBookingsList.mockReturnValue(baseList());
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

  it('requests Past filter when the Past tab is pressed', () => {
    const setListFilter = jest.fn();
    mockUseBookingsList.mockReturnValue(baseList({ setListFilter }));
    renderWithProviders(<BookingsScreen />);
    fireEvent.press(screen.getByLabelText('Past appointments'));
    expect(setListFilter).toHaveBeenCalledWith(BOOKINGS_FILTER_PAST);
  });
});

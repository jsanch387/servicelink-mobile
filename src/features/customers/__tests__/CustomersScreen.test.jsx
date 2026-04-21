import { fireEvent, screen } from '@testing-library/react-native';
import { CustomersScreen } from '../screens/CustomersScreen';
import { useCustomersList } from '../hooks/useCustomersList';
import { renderWithProviders } from '../../home/__tests__/testUtils';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

jest.mock('../hooks/useCustomersList', () => ({
  useCustomersList: jest.fn(),
}));

const mockUseCustomersList = useCustomersList;

function baseHook(overrides = {}) {
  return {
    business: { id: 'b1' },
    businessError: null,
    listError: null,
    customers: [],
    isPendingBusiness: false,
    isPendingList: false,
    isLoading: false,
    isFetching: false,
    refetch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('CustomersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCustomersList.mockReturnValue(baseHook());
  });

  it('renders loading skeleton while loading', () => {
    mockUseCustomersList.mockReturnValue(
      baseHook({
        isLoading: true,
      }),
    );

    renderWithProviders(<CustomersScreen />);
    expect(screen.queryByText(/Showing/i)).toBeNull();
  });

  it('navigates to customer details when card is pressed', () => {
    mockUseCustomersList.mockReturnValue(
      baseHook({
        customers: [
          {
            id: 'c1',
            fullName: 'Jane Fuller',
            segment: 'new',
            status: 'new',
            pastVisitsSummary: 'No past visits yet',
            scheduleLabel: 'Next appointment',
            nextAppointmentDateLabel: 'April 28, 2026',
            nextAppointmentRelativeLabel: 'in 8 days',
          },
        ],
      }),
    );

    renderWithProviders(<CustomersScreen />);

    fireEvent.press(screen.getByText('Jane Fuller'));
    expect(mockNavigate).toHaveBeenCalledWith('CustomerDetails', {
      customerId: 'c1',
    });
  });
});

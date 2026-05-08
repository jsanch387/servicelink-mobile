import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import { CustomersScreen } from '../screens/CustomersScreen';
import { useCreateCustomer } from '../hooks/useCreateCustomer';
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

jest.mock('../hooks/useCreateCustomer');

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 80,
}));

const mockUseCustomersList = useCustomersList;
const mockUseCreateCustomer = useCreateCustomer;

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
    mockUseCreateCustomer.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ id: 'cust-new' }),
      reset: jest.fn(),
      isPending: false,
    });
  });

  it('renders loading skeleton while loading', () => {
    mockUseCustomersList.mockReturnValue(
      baseHook({
        isLoading: true,
      }),
    );

    renderWithProviders(<CustomersScreen />);
    expect(screen.queryByText(/Showing/i)).toBeNull();
    expect(screen.queryByText('No customers yet')).toBeNull();
  });

  it('shows friendly empty copy when the business has no customers yet', () => {
    renderWithProviders(<CustomersScreen />);
    expect(screen.getByText('No customers yet')).toBeTruthy();
    expect(
      screen.getByText(
        /When someone schedules an appointment, a customer profile is created automatically from their booking details/i,
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/Showing/i)).toBeNull();
  });

  it('shows no-match copy when search filters out every customer', () => {
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
    fireEvent.changeText(screen.getByPlaceholderText('Search by customer name...'), 'zzz');
    expect(screen.getByText('No matching customers')).toBeTruthy();
    expect(screen.getByText(/Try adjusting your search or filter/i)).toBeTruthy();
  });

  it('opens add-customer sheet from the floating action button', () => {
    renderWithProviders(<CustomersScreen />);
    fireEvent.press(screen.getByLabelText('Add customer'));
    expect(screen.getByText('Add customer')).toBeTruthy();
    expect(screen.getByText('Add a new customer to your list.')).toBeTruthy();
    expect(screen.getByText('Name *')).toBeTruthy();
    expect(screen.getByText('Phone number (optional)')).toBeTruthy();
    expect(screen.getByText('Email (optional)')).toBeTruthy();
    expect(screen.getByText('Notes (optional)')).toBeTruthy();
    fireEvent.press(screen.getByText('Cancel'));
  });

  it('shows confirmation after Add, then closes on Done', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({ id: 'cust-new' });
    mockUseCreateCustomer.mockReturnValue({
      mutateAsync,
      reset: jest.fn(),
      isPending: false,
    });

    const view = renderWithProviders(<CustomersScreen />);
    fireEvent.press(screen.getByLabelText('Add customer'));
    const inputs = view.UNSAFE_getAllByType(TextInput);
    /** [0] search bar; [1] name in add-customer sheet */
    fireEvent.changeText(inputs[1], 'Jamie Chen');
    fireEvent.press(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        fullName: 'Jamie Chen',
        phone: '',
        email: '',
        notes: '',
      });
    });
    await waitFor(() => {
      expect(screen.getByText('Customer added')).toBeTruthy();
    });
    expect(screen.getByText(/Jamie Chen is on your list/)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText('Customer added')).toBeNull();
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
      customerName: 'Jane Fuller',
      customerSegment: 'new',
    });
  });
});

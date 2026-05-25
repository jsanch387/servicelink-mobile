import { fireEvent, screen } from '@testing-library/react-native';
import { MaintenanceScreen } from '../screens/MaintenanceScreen';
import { useMaintenanceInbox } from '../hooks/useMaintenanceInbox';
import {
  MAINTENANCE_LIST_EMPTY_COMPLETED,
  MAINTENANCE_LIST_EMPTY_CONFIRMED,
  MAINTENANCE_LIST_EMPTY_PENDING,
} from '../constants';
import { renderWithProviders } from '../../home/__tests__/testUtils';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 0,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../hooks/useMaintenanceInbox', () => ({
  useMaintenanceInbox: jest.fn(),
}));

const mockUseMaintenanceInbox = useMaintenanceInbox;

function card(overrides = {}) {
  return {
    customerId: 'c1',
    customerName: 'Alex Rivera',
    enrollmentId: 'e1',
    statusLabel: 'Pending',
    statusRaw: 'enrolled_pending_customer',
    line: '$100 · 2 hrs',
    ...overrides,
  };
}

function baseInbox(overrides = {}) {
  return {
    business: { id: 'biz-1' },
    businessError: null,
    listError: null,
    pendingCards: [],
    confirmedCards: [],
    completedCards: [],
    isLoading: false,
    isFetching: false,
    refetch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('MaintenanceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMaintenanceInbox.mockReturnValue(baseInbox());
  });

  it('renders loading skeleton without empty-state copy', () => {
    mockUseMaintenanceInbox.mockReturnValue(baseInbox({ isLoading: true }));

    renderWithProviders(<MaintenanceScreen />);

    expect(screen.queryByText(MAINTENANCE_LIST_EMPTY_PENDING.title)).toBeNull();
    expect(screen.queryByText('Alex Rivera')).toBeNull();
  });

  it('shows pending empty copy on default tab', () => {
    renderWithProviders(<MaintenanceScreen />);

    expect(screen.getByText(MAINTENANCE_LIST_EMPTY_PENDING.title)).toBeTruthy();
    expect(screen.getByText(MAINTENANCE_LIST_EMPTY_PENDING.body)).toBeTruthy();
  });

  it('shows confirmed empty copy when Confirmed tab is selected', () => {
    renderWithProviders(<MaintenanceScreen />);

    fireEvent.press(screen.getByText('Confirmed'));
    expect(screen.getByText(MAINTENANCE_LIST_EMPTY_CONFIRMED.title)).toBeTruthy();
  });

  it('shows completed empty copy when Completed tab is selected', () => {
    renderWithProviders(<MaintenanceScreen />);

    fireEvent.press(screen.getByText('Completed'));
    expect(screen.getByText(MAINTENANCE_LIST_EMPTY_COMPLETED.title)).toBeTruthy();
  });

  it('lists pending cards and navigates to detail on press', () => {
    mockUseMaintenanceInbox.mockReturnValue(
      baseInbox({
        pendingCards: [card()],
        confirmedCards: [
          card({ enrollmentId: 'e2', statusLabel: 'Confirmed', statusRaw: 'accepted' }),
        ],
      }),
    );

    renderWithProviders(<MaintenanceScreen />);

    expect(screen.getByText('Alex Rivera')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Maintenance for Alex Rivera'));
    expect(mockNavigate).toHaveBeenCalledWith('MaintenanceDetail', {
      customerId: 'c1',
      enrollmentId: 'e1',
    });
  });

  it('shows confirmed cards only on Confirmed tab', () => {
    mockUseMaintenanceInbox.mockReturnValue(
      baseInbox({
        pendingCards: [card({ customerName: 'Pending Person' })],
        confirmedCards: [
          card({
            customerName: 'Confirmed Person',
            enrollmentId: 'e-confirmed',
            statusLabel: 'Confirmed',
            statusRaw: 'accepted',
          }),
        ],
      }),
    );

    renderWithProviders(<MaintenanceScreen />);
    expect(screen.getByText('Pending Person')).toBeTruthy();
    expect(screen.queryByText('Confirmed Person')).toBeNull();

    fireEvent.press(screen.getByText('Confirmed'));
    expect(screen.getByText('Confirmed Person')).toBeTruthy();
    expect(screen.queryByText('Pending Person')).toBeNull();
  });

  it('shows completed cards only on Completed tab', () => {
    mockUseMaintenanceInbox.mockReturnValue(
      baseInbox({
        completedCards: [
          card({
            customerName: 'Done Person',
            enrollmentId: 'e-done',
            statusLabel: 'Completed',
            statusRaw: 'visit_completed',
          }),
        ],
      }),
    );

    renderWithProviders(<MaintenanceScreen />);
    fireEvent.press(screen.getByText('Completed'));
    expect(screen.getByText('Done Person')).toBeTruthy();
    expect(screen.getByLabelText('Maintenance for Done Person')).toBeTruthy();
  });

  it('surfaces list errors', () => {
    mockUseMaintenanceInbox.mockReturnValue(
      baseInbox({
        listError: 'Could not load maintenance',
      }),
    );

    renderWithProviders(<MaintenanceScreen />);
    expect(screen.getByText('Could not load maintenance')).toBeTruthy();
  });
});

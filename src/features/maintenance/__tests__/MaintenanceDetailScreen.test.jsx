import { screen } from '@testing-library/react-native';
import { MaintenanceDetailScreen } from '../screens/MaintenanceDetailScreen';
import { useMaintenanceDetail } from '../hooks/useMaintenanceDetail';
import {
  MAINTENANCE_DETAIL_COPY_LINK_BUTTON,
  MAINTENANCE_DETAIL_CUSTOMER_CHOOSES_SCHEDULE_COPY,
  MAINTENANCE_DETAIL_DELETE_BUTTON,
  MAINTENANCE_DETAIL_NOT_FOUND_USER_MESSAGE,
} from '../constants';
import { renderWithProviders } from '../../home/__tests__/testUtils';

const mockSetOptions = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: mockGoBack,
    setOptions: mockSetOptions,
  }),
  useRoute: jest.fn(),
}));

jest.mock('../hooks/useMaintenanceDetail', () => ({
  useMaintenanceDetail: jest.fn(),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
}));

const { useRoute } = require('@react-navigation/native');
const mockUseMaintenanceDetail = useMaintenanceDetail;

function detailModel(overrides = {}) {
  return {
    customerId: 'c1',
    customerName: 'Alex Rivera',
    customerEmail: 'alex@example.com',
    enrollmentId: 'e1',
    serviceTitle: 'Maintenance',
    priceFormatted: '$100',
    durationLabel: '2 hrs',
    scheduleChosenByOwner: true,
    showCustomerChoosesSchedule: false,
    customerChoosesScheduleCopy: MAINTENANCE_DETAIL_CUSTOMER_CHOOSES_SCHEDULE_COPY,
    anchorDateDisplay: 'June 1, 2026',
    anchorTimeDisplay: '9:00 AM',
    statusLabel: 'Confirmed',
    statusRaw: 'accepted',
    paymentStatus: 'paid',
    initialBookingId: 'book-1',
    payment: {
      visible: true,
      status: 'Paid online',
      detail: '$100',
      accessibilityLabel: 'Paid online. $100.',
    },
    inviteLink: 'https://app.example.com/maintenance/e/tok-abc',
    canCopyLink: true,
    canDelete: false,
    ...overrides,
  };
}

function baseDetailHook(overrides = {}) {
  return {
    businessId: 'biz-1',
    model: null,
    isLoading: false,
    detailError: null,
    businessError: null,
    notFound: false,
    refetch: jest.fn().mockResolvedValue(undefined),
    isFetching: false,
    ...overrides,
  };
}

describe('MaintenanceDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRoute.mockReturnValue({ params: { customerId: 'c1', enrollmentId: 'e1' } });
    mockUseMaintenanceDetail.mockReturnValue(baseDetailHook());
  });

  it('shows error when route params are missing', () => {
    useRoute.mockReturnValue({ params: {} });

    renderWithProviders(<MaintenanceDetailScreen />);
    expect(screen.getByText(/We could not load this maintenance offer/i)).toBeTruthy();
  });

  it('renders skeleton while loading', () => {
    mockUseMaintenanceDetail.mockReturnValue(
      baseDetailHook({
        isLoading: true,
      }),
    );

    renderWithProviders(<MaintenanceDetailScreen />);
    expect(screen.queryByText('Alex Rivera')).toBeNull();
    expect(screen.queryByText(MAINTENANCE_DETAIL_COPY_LINK_BUTTON)).toBeNull();
  });

  it('renders confirmed detail sections and payment', () => {
    mockUseMaintenanceDetail.mockReturnValue(
      baseDetailHook({
        model: detailModel(),
      }),
    );

    renderWithProviders(<MaintenanceDetailScreen />);

    expect(screen.getByText('Maintenance')).toBeTruthy();
    expect(screen.getAllByText('$100').length).toBeGreaterThan(0);
    expect(screen.getByText('Confirmed')).toBeTruthy();
    expect(screen.getByText('June 1, 2026')).toBeTruthy();
    expect(screen.getByText('9:00 AM')).toBeTruthy();
    expect(screen.getByText('Paid online')).toBeTruthy();
    expect(screen.getByText('Alex Rivera')).toBeTruthy();
    expect(screen.getByText(MAINTENANCE_DETAIL_COPY_LINK_BUTTON)).toBeTruthy();
    expect(screen.queryByText(MAINTENANCE_DETAIL_DELETE_BUTTON)).toBeNull();
  });

  it('shows customer-chooses schedule copy when owner skipped schedule', () => {
    mockUseMaintenanceDetail.mockReturnValue(
      baseDetailHook({
        model: detailModel({
          scheduleChosenByOwner: false,
          showCustomerChoosesSchedule: true,
          anchorDateDisplay: '',
          anchorTimeDisplay: '',
          statusLabel: 'Pending',
          statusRaw: 'enrolled_pending_customer',
          canDelete: true,
          payment: { visible: false, status: '', detail: null, accessibilityLabel: '' },
        }),
      }),
    );

    renderWithProviders(<MaintenanceDetailScreen />);
    expect(screen.getByText(MAINTENANCE_DETAIL_CUSTOMER_CHOOSES_SCHEDULE_COPY)).toBeTruthy();
    expect(screen.getByText(MAINTENANCE_DETAIL_DELETE_BUTTON)).toBeTruthy();
  });

  it('shows completed status and hides remove for finished visits', () => {
    mockUseMaintenanceDetail.mockReturnValue(
      baseDetailHook({
        model: detailModel({
          statusLabel: 'Completed',
          statusRaw: 'visit_completed',
        }),
      }),
    );

    renderWithProviders(<MaintenanceDetailScreen />);
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.queryByText(MAINTENANCE_DETAIL_DELETE_BUTTON)).toBeNull();
  });

  it('shows not-found message when enrollment is missing', () => {
    mockUseMaintenanceDetail.mockReturnValue(
      baseDetailHook({
        notFound: true,
      }),
    );

    renderWithProviders(<MaintenanceDetailScreen />);
    expect(screen.getByText(MAINTENANCE_DETAIL_NOT_FOUND_USER_MESSAGE)).toBeTruthy();
    expect(screen.getByText('Back to maintenance')).toBeTruthy();
  });
});

import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AvailabilityScreen } from '../screens/AvailabilityScreen';
import { renderWithProviders } from '../../home/__tests__/testUtils';

const mockUseBusinessAvailability = jest.fn();
const mockSaveAvailability = jest.fn();
const mockUseSaveBusinessAvailability = jest.fn();

jest.mock('../hooks/useBusinessAvailability', () => ({
  useBusinessAvailability: (...args) => mockUseBusinessAvailability(...args),
}));

jest.mock('../hooks/useSaveBusinessAvailability', () => ({
  useSaveBusinessAvailability: (...args) => mockUseSaveBusinessAvailability(...args),
}));

jest.mock('../components/TimeOffSheet', () => ({
  TimeOffSheet: () => null,
}));

const BASE_MODEL = {
  acceptBookings: false,
  selectedPreset: 'custom',
  dayEnabledMap: {
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: false,
    Sunday: false,
  },
  dayTimeRanges: {
    Monday: { start: '9:00 AM', end: '5:00 PM' },
    Tuesday: { start: '9:00 AM', end: '5:00 PM' },
    Wednesday: { start: '9:00 AM', end: '5:00 PM' },
    Thursday: { start: '9:00 AM', end: '5:00 PM' },
    Friday: { start: '9:00 AM', end: '5:00 PM' },
    Saturday: { start: '9:00 AM', end: '5:00 PM' },
    Sunday: { start: '9:00 AM', end: '5:00 PM' },
  },
  timeOffBlocks: [],
  minimumNotice: 'none',
  bufferTime: 'none',
};

function openSettings() {
  fireEvent.press(screen.getByText('Settings'));
}

describe('AvailabilityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBusinessAvailability.mockReturnValue({
      businessId: 'biz-1',
      isLoading: false,
      isFetching: false,
      businessError: null,
      availabilityError: null,
      refetch: jest.fn(),
      row: { minimum_notice: 'none' },
      model: BASE_MODEL,
    });
    mockSaveAvailability.mockResolvedValue({});
    mockUseSaveBusinessAvailability.mockReturnValue({
      saveAvailability: mockSaveAvailability,
      isSaving: false,
      saveError: '',
    });
  });

  it('shows the weekly schedule on the default tab', () => {
    renderWithProviders(<AvailabilityScreen />);
    expect(screen.getByText('Your schedule')).toBeTruthy();
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0);
    expect(screen.queryByText('Buffer time')).toBeNull();
    expect(screen.queryByLabelText('Accept booking requests')).toBeNull();
  });

  it('shows settings controls on the settings tab', () => {
    renderWithProviders(<AvailabilityScreen />);
    openSettings();
    expect(screen.getByLabelText('Accept booking requests')).toBeTruthy();
    expect(screen.getByText('Time off')).toBeTruthy();
    expect(screen.getByText('Lead time')).toBeTruthy();
    expect(screen.getByText('Buffer time')).toBeTruthy();
    expect(screen.queryByText('Unavailable')).toBeNull();
  });

  it('disables save initially and enables after toggling availability', async () => {
    renderWithProviders(<AvailabilityScreen />);

    const saveBtn = screen.getByRole('button', { name: 'Save changes' });
    expect(saveBtn.props.accessibilityState?.disabled).toBe(true);

    openSettings();
    fireEvent(screen.getByLabelText('Accept booking requests'), 'valueChange', true);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Save changes' }).props.accessibilityState?.disabled,
      ).toBe(false);
    });
  });

  it('shows Unavailable when a day is disabled', async () => {
    renderWithProviders(<AvailabilityScreen />);
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0);
  });

  it('calls save with custom preset and weekly payload', async () => {
    renderWithProviders(<AvailabilityScreen />);
    openSettings();
    fireEvent(screen.getByLabelText('Accept booking requests'), 'valueChange', true);

    fireEvent.press(screen.getByText('Save changes'));

    await waitFor(() => expect(mockSaveAvailability).toHaveBeenCalledTimes(1));
    const payload = mockSaveAvailability.mock.calls[0][0];
    expect(payload.selectedPreset).toBe('custom');
    expect(payload.minimumNotice).toBe('none');
    expect(payload.bufferTime).toBe('none');
    expect(payload.weeklySchedule.monday).toBeDefined();
    expect(Array.isArray(payload.timeOffBlocks)).toBe(true);
  });

  it('shows a loaded buffer time and includes it on save', async () => {
    mockUseBusinessAvailability.mockReturnValue({
      businessId: 'biz-1',
      isLoading: false,
      isFetching: false,
      businessError: null,
      availabilityError: null,
      refetch: jest.fn(),
      row: { minimum_notice: 'none', buffer_time: '30m' },
      model: { ...BASE_MODEL, bufferTime: '30m' },
    });
    renderWithProviders(<AvailabilityScreen />);
    openSettings();
    expect(screen.getByText('30 min')).toBeTruthy();

    fireEvent(screen.getByLabelText('Accept booking requests'), 'valueChange', true);
    fireEvent.press(screen.getByText('Save changes'));

    await waitFor(() => expect(mockSaveAvailability).toHaveBeenCalledTimes(1));
    expect(mockSaveAvailability.mock.calls[0][0].bufferTime).toBe('30m');
  });

  it('disables accept switch when no day is enabled', () => {
    mockUseBusinessAvailability.mockReturnValue({
      businessId: 'biz-1',
      isLoading: false,
      isFetching: false,
      businessError: null,
      availabilityError: null,
      refetch: jest.fn(),
      row: { minimum_notice: 'none' },
      model: {
        ...BASE_MODEL,
        acceptBookings: false,
        dayEnabledMap: {
          Monday: false,
          Tuesday: false,
          Wednesday: false,
          Thursday: false,
          Friday: false,
          Saturday: false,
          Sunday: false,
        },
      },
    });
    renderWithProviders(<AvailabilityScreen />);
    openSettings();
    const acceptSwitch = screen.getByLabelText('Accept booking requests');
    expect(acceptSwitch.props.disabled).toBe(true);
  });

  it('turns off accept when the last active day is disabled', async () => {
    mockUseBusinessAvailability.mockReturnValue({
      businessId: 'biz-1',
      isLoading: false,
      isFetching: false,
      businessError: null,
      availabilityError: null,
      refetch: jest.fn(),
      row: { minimum_notice: 'none' },
      model: {
        ...BASE_MODEL,
        acceptBookings: true,
        dayEnabledMap: {
          Monday: true,
          Tuesday: false,
          Wednesday: false,
          Thursday: false,
          Friday: false,
          Saturday: false,
          Sunday: false,
        },
      },
    });
    renderWithProviders(<AvailabilityScreen />);
    const switches = screen.UNSAFE_getAllByType(require('react-native').Switch);
    fireEvent(switches[0], 'valueChange', false);
    openSettings();
    await waitFor(() => {
      expect(screen.getByLabelText('Accept booking requests').props.value).toBe(false);
    });
  });
});

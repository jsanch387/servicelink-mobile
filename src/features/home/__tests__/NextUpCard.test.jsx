import { act, fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { NextUpCard } from '../components/NextUpCard';
import * as outbound from '../utils/appointmentOutbound';
import { renderWithProviders } from './testUtils';

const mockNotifyOnTheWay = jest.fn();
const mockStartJob = jest.fn();
const mockRunAction = jest.fn();
let mockBookingActionState = {
  notifyOnTheWay: mockNotifyOnTheWay,
  startJob: mockStartJob,
  workFinished: jest.fn(),
  runAction: mockRunAction,
  isSending: false,
  disabled: false,
  isOnTheWayDone: () => false,
  isJobStartedDone: () => false,
};

jest.mock('../constants/nextUpDesignFlags', () => ({
  NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS: true,
  NEXT_UP_ON_MY_WAY_TRY_IT_BADGE: false,
  NEXT_UP_LIFECYCLE_DESIGN_PREVIEW: false,
  ON_MY_WAY_CONFIRM_DESIGN_PREVIEW: false,
}));

jest.mock('../../bookings/hooks/useBookingAction', () => ({
  useBookingAction: () => mockBookingActionState,
}));

jest.spyOn(outbound, 'openMapsForBooking').mockImplementation(() => {});

const baseBooking = {
  id: '1',
  customer_name: 'Alex',
  service_name: 'Install',
  customer_phone: '5552345678',
  customer_street_address: '1 Main',
  customer_city: 'Austin',
  customer_state: 'TX',
  customer_zip: '78701',
};

describe('NextUpCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotifyOnTheWay.mockResolvedValue({ ok: true });
    mockBookingActionState = {
      notifyOnTheWay: mockNotifyOnTheWay,
      startJob: mockStartJob,
      workFinished: jest.fn(),
      runAction: mockRunAction,
      isSending: false,
      disabled: false,
      isOnTheWayDone: () => false,
      isJobStartedDone: () => false,
    };
  });

  it('renders skeleton while loading', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading
        nextBooking={null}
        subtitle=""
      />,
    );
    expect(screen.queryByText('Next up')).toBeNull();
  });

  it('shows empty state when there is no next booking', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={null}
        subtitle=""
      />,
    );
    expect(screen.getByText('Nothing scheduled yet')).toBeTruthy();
    expect(screen.getByText('Your next booking will show up here.')).toBeTruthy();
    expect(screen.queryByLabelText('On my way')).toBeNull();
    expect(screen.queryByLabelText('Navigate')).toBeNull();
  });

  it('working: live pulse and single Mark complete action', () => {
    const onMarkComplete = jest.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        markCompleteLoading={false}
        nextBooking={{
          ...baseBooking,
          job_status: 'in_progress',
          work_handoff_status: 'skipped',
        }}
        onMarkComplete={onMarkComplete}
        subtitle="Started at 2:00 PM"
      />,
    );
    expect(screen.getByTestId('next-up-live-pulse')).toBeTruthy();
    expect(screen.getByText('Started at 2:00 PM')).toBeTruthy();
    expect(screen.getByText('Alex')).toBeTruthy();
    expect(screen.getByLabelText('Mark complete')).toBeTruthy();
    expect(screen.queryByLabelText('Text customer')).toBeNull();
    expect(screen.queryByLabelText('On my way')).toBeNull();
    expect(screen.queryByLabelText('Navigate')).toBeNull();
  });

  it('upcoming: shows On my way and Navigate below, no header Maps', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'not_started' }}
        spotlightMode="upcoming"
        subtitle="Today at 2:00 PM"
      />,
    );
    expect(screen.queryByTestId('next-up-live-pulse')).toBeNull();
    expect(screen.queryByTestId('next-up-navigate-icon')).toBeNull();
    expect(screen.getByLabelText('On my way')).toBeTruthy();
    expect(screen.getByLabelText('Navigate')).toBeTruthy();
    expect(screen.queryByLabelText('Mark complete')).toBeNull();
  });

  it('upcoming: shows Try it badge on On my way when SMS lifecycle launch badge is on', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'not_started' }}
        showOnMyWayTryItBadge
        useLifecycleActions
        subtitle="Today at 2:00 PM"
      />,
    );
    expect(screen.getByTestId('on-my-way-try-it-badge')).toBeTruthy();
  });

  it('upcoming: hides Try it badge when lifecycle SMS is off', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'not_started' }}
        showOnMyWayTryItBadge
        useLifecycleActions={false}
        subtitle="Today at 2:00 PM"
      />,
    );
    expect(screen.queryByTestId('on-my-way-try-it-badge')).toBeNull();
  });

  it('en route: shows Navigate in header and slide to start job below', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'on_the_way' }}
        subtitle="On the way"
      />,
    );
    expect(screen.getByTestId('slide-to-start-job-track')).toBeTruthy();
    expect(screen.getByTestId('next-up-navigate-icon')).toBeTruthy();
    expect(screen.getByLabelText('Navigate')).toBeTruthy();
    expect(screen.queryByText('Navigate')).toBeNull();
    expect(screen.queryByLabelText('On my way')).toBeNull();
  });

  it('en route: keeps Navigate in header when spotlight is in progress by time', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'on_the_way' }}
        spotlightMode="in_progress"
        subtitle="On the way"
      />,
    );
    expect(screen.getByTestId('next-up-navigate-icon')).toBeTruthy();
    expect(screen.queryByTestId('next-up-live-pulse')).toBeNull();
    expect(screen.getByTestId('slide-to-start-job-track')).toBeTruthy();
  });

  it('en route: navigate icon opens maps', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'on_the_way' }}
        subtitle="On the way"
      />,
    );
    fireEvent.press(screen.getByLabelText('Navigate'));
    expect(outbound.openMapsForBooking).toHaveBeenCalledWith({
      ...baseBooking,
      job_status: 'on_the_way',
    });
  });

  it('completed job shows booking details without actions', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'completed' }}
        subtitle="Completed at 3:40 PM"
      />,
    );
    expect(screen.getByText('Alex')).toBeTruthy();
    expect(screen.queryByLabelText('Mark complete')).toBeNull();
    expect(screen.queryByLabelText('On my way')).toBeNull();
  });

  it('working ready: shows Mark complete when handoff is done', () => {
    const onMarkComplete = jest.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        markCompleteLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'in_progress', work_handoff_status: 'notified' }}
        onMarkComplete={onMarkComplete}
        subtitle="Started at 2:00 PM"
      />,
    );
    expect(screen.getByLabelText('Mark complete')).toBeTruthy();
    expect(screen.queryByLabelText('Done')).toBeNull();
  });

  it('working handoff: shows Done and Skip from work_handoff_status', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'in_progress', work_handoff_status: null }}
        subtitle="Started at 2:00 PM"
      />,
    );
    expect(screen.getByLabelText('Done')).toBeTruthy();
    expect(screen.getByLabelText('Skip')).toBeTruthy();
    expect(screen.queryByLabelText('Mark complete')).toBeNull();
  });

  it('working handoff: Done opens confirm then Send calls workFinished with notify true', async () => {
    const mockWorkFinished = jest.fn().mockResolvedValue({ ok: true });
    mockBookingActionState = {
      ...mockBookingActionState,
      workFinished: mockWorkFinished,
    };
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'in_progress', work_handoff_status: null }}
        subtitle="Started at 2:00 PM"
      />,
    );
    fireEvent.press(screen.getByLabelText('Done'));
    expect(mockWorkFinished).not.toHaveBeenCalled();
    expect(screen.getByText('Let your customer know you are done.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Send'));
    expect(mockWorkFinished).toHaveBeenCalledWith('1', true, { suppressUiFeedback: true });
  });

  it('working handoff: Skip opens confirm then Continue calls workFinished with notify false', () => {
    const mockWorkFinished = jest.fn().mockResolvedValue({ ok: true });
    mockBookingActionState = {
      ...mockBookingActionState,
      workFinished: mockWorkFinished,
    };
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'in_progress', work_handoff_status: null }}
        subtitle="Started at 2:00 PM"
      />,
    );
    fireEvent.press(screen.getByLabelText('Skip'));
    expect(mockWorkFinished).not.toHaveBeenCalled();
    expect(screen.getByText('Skip texting?')).toBeTruthy();
    expect(screen.getByText('Continue without telling your customer you’re done.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Continue'));
    expect(mockWorkFinished).toHaveBeenCalledWith('1', false);
  });

  it('working handoff: Skip confirm Cancel does not call workFinished', () => {
    const mockWorkFinished = jest.fn().mockResolvedValue({ ok: true });
    mockBookingActionState = {
      ...mockBookingActionState,
      workFinished: mockWorkFinished,
    };
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'in_progress', work_handoff_status: null }}
        subtitle="Started at 2:00 PM"
      />,
    );
    fireEvent.press(screen.getByLabelText('Skip'));
    fireEvent.press(screen.getByLabelText('Cancel'));
    expect(mockWorkFinished).not.toHaveBeenCalled();
  });

  it('uses actionHandlers instead of booking action hook', () => {
    const onOnMyWay = jest.fn();
    renderWithProviders(
      <NextUpCard
        actionHandlers={{ onOnMyWay, isSending: false, disabled: false }}
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'not_started' }}
        subtitle="Today at 2:00 PM"
      />,
    );
    fireEvent.press(screen.getByLabelText('On my way'));
    expect(onOnMyWay).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('Send'));
    expect(onOnMyWay).toHaveBeenCalledTimes(1);
    expect(mockNotifyOnTheWay).not.toHaveBeenCalled();
  });

  it('working: Mark complete disabled without onMarkComplete', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'in_progress' }}
        subtitle="Started at 2:00 PM"
        workingPhase="ready"
      />,
    );
    expect(screen.getByLabelText('Mark complete')).toBeDisabled();
  });

  it('working: Mark complete disabled while loading', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        markCompleteLoading
        nextBooking={{
          ...baseBooking,
          job_status: 'in_progress',
          work_handoff_status: 'notified',
        }}
        onMarkComplete={jest.fn()}
        subtitle="Started at 2:00 PM"
      />,
    );
    expect(screen.getByLabelText('Mark complete')).toBeDisabled();
  });

  it('working: card accessibility label leads with In progress', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'in_progress' }}
        onMarkComplete={jest.fn()}
        subtitle="Started at 2:00 PM"
      />,
    );
    expect(screen.getByLabelText(/In progress.*Alex/i)).toBeTruthy();
  });

  it('calls onMarkComplete when Mark complete is pressed', () => {
    const onMarkComplete = jest.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{
          ...baseBooking,
          job_status: 'in_progress',
          work_handoff_status: 'skipped',
        }}
        onMarkComplete={onMarkComplete}
        subtitle="Started at 2:00 PM"
      />,
    );
    fireEvent.press(screen.getByLabelText('Mark complete'));
    expect(onMarkComplete).toHaveBeenCalledTimes(1);
  });

  it('shows customer, service, subtitle, and enables actions when booking has phone and address', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'not_started' }}
        subtitle="Today at 2:00 PM"
      />,
    );
    expect(screen.getByText('Alex')).toBeTruthy();
    expect(screen.getByText('Install')).toBeTruthy();
    expect(screen.getByText('Today at 2:00 PM')).toBeTruthy();
    expect(screen.getByLabelText('On my way')).not.toBeDisabled();
    expect(screen.getByLabelText('Navigate')).not.toBeDisabled();
  });

  it('shows service name only (no pricing tier) and vehicle on the muted line', () => {
    const nextBooking = {
      id: '2',
      customer_name: 'Jordan Lee',
      service_name: 'Signature Shine — SUV',
      customer_vehicle_year: '2017',
      customer_vehicle_make: 'Toyota',
      customer_vehicle_model: 'Tacoma',
      customer_phone: '5552345678',
      customer_street_address: '1 Main',
      customer_city: 'Austin',
      customer_state: 'TX',
      customer_zip: '78701',
      job_status: 'not_started',
    };
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={nextBooking}
        subtitle="Tomorrow at 9:00 AM"
      />,
    );
    expect(screen.getByText('Jordan Lee')).toBeTruthy();
    expect(screen.getByText('Signature Shine')).toBeTruthy();
    expect(screen.queryByText('Signature Shine — SUV')).toBeNull();
    expect(screen.getByText('2017 Toyota Tacoma')).toBeTruthy();
  });

  it('shows +N more on the service line for multi-job visits', () => {
    const nextBooking = {
      id: '2',
      customer_name: 'Jordan Lee',
      service_name: 'Signature Shine — SUV',
      visit_job_count: 2,
      job_details: [
        { serviceName: 'Signature Shine', servicePriceOptionLabel: 'SUV' },
        { serviceName: 'Touch-up paint' },
      ],
      customer_phone: '5552345678',
      job_status: 'not_started',
    };
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={nextBooking}
        subtitle="Tomorrow at 9:00 AM"
      />,
    );
    expect(screen.getByText('Signature Shine')).toBeTruthy();
    expect(screen.getByText('+1 more')).toBeTruthy();
  });

  it('upcoming: On my way disabled without a customer phone', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, customer_phone: null, job_status: 'not_started' }}
        spotlightMode="upcoming"
        subtitle="Today at 2:00 PM"
      />,
    );
    expect(screen.getByLabelText('On my way')).toBeDisabled();
    fireEvent.press(screen.getByLabelText('On my way'));
    expect(mockNotifyOnTheWay).not.toHaveBeenCalled();
  });

  it('notifies on-my-way with the booking id after confirm and invokes maps helper on press', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'not_started' }}
        subtitle=""
      />,
    );
    fireEvent.press(screen.getByLabelText('On my way'));
    expect(mockNotifyOnTheWay).not.toHaveBeenCalled();
    expect(screen.getByText('Let your customer know you are on the way.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Send'));
    expect(mockNotifyOnTheWay).toHaveBeenCalledWith('1', true, { suppressUiFeedback: true });
    fireEvent.press(screen.getByLabelText('Navigate'));
    expect(outbound.openMapsForBooking).toHaveBeenCalledWith({
      ...baseBooking,
      job_status: 'not_started',
    });
  });

  it('closes on-my-way confirm without sending', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'not_started' }}
        subtitle=""
      />,
    );
    fireEvent.press(screen.getByLabelText('On my way'));
    fireEvent.press(screen.getByLabelText('Close'));
    expect(mockNotifyOnTheWay).not.toHaveBeenCalled();
  });

  it('skips on-my-way text after confirming the native skip alert', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((b) => b.text === 'Confirm')?.onPress?.();
    });
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'not_started' }}
        subtitle=""
      />,
    );
    fireEvent.press(screen.getByLabelText('On my way'));
    fireEvent.press(screen.getByLabelText('Skip'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Skip texting?',
      "The customer won't be notified that you're on the way.",
      expect.any(Array),
    );
    expect(mockNotifyOnTheWay).toHaveBeenCalledWith('1', false);
    alertSpy.mockRestore();
  });

  it('does not skip on-my-way when the native skip alert is canceled', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'not_started' }}
        subtitle=""
      />,
    );
    fireEvent.press(screen.getByLabelText('On my way'));
    fireEvent.press(screen.getByLabelText('Skip'));
    expect(alertSpy).toHaveBeenCalled();
    expect(mockNotifyOnTheWay).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('keeps Navigate enabled without an address so missing-address feedback can show', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{
          ...baseBooking,
          job_status: 'not_started',
          customer_street_address: null,
          customer_city: null,
          customer_state: null,
          customer_zip: null,
        }}
        spotlightMode="upcoming"
        subtitle=""
      />,
    );
    expect(screen.getByLabelText('Navigate')).not.toBeDisabled();
    fireEvent.press(screen.getByLabelText('Navigate'));
    expect(outbound.openMapsForBooking).toHaveBeenCalled();
  });

  it('disables On my way while a send is in flight', () => {
    mockBookingActionState = {
      notifyOnTheWay: mockNotifyOnTheWay,
      runAction: mockRunAction,
      isSending: true,
      disabled: true,
      isOnTheWayDone: () => false,
    };
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'not_started' }}
        spotlightMode="upcoming"
        subtitle=""
      />,
    );
    expect(screen.getByLabelText('On my way')).toBeDisabled();
  });

  it('start job calls booking action when en route slider completes', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'on_the_way' }}
        subtitle="On the way"
      />,
    );
    const track = screen.getByTestId('slide-to-start-job-track');
    act(() => {
      track.props.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } });
    });
    expect(mockStartJob).toHaveBeenCalledWith('1');
  });

  it('shows schedule error from bookings', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError="Bookings failed"
        businessError={null}
        isLoading={false}
        nextBooking={null}
        subtitle=""
      />,
    );
    expect(screen.getByText('Bookings failed')).toBeTruthy();
  });

  it('shows schedule error from businessError', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError="Business unavailable"
        isLoading={false}
        nextBooking={null}
        subtitle=""
      />,
    );
    expect(screen.getByText('Business unavailable')).toBeTruthy();
  });
});

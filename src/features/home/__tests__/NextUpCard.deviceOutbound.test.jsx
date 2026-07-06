import { fireEvent, screen } from '@testing-library/react-native';
import { NextUpCard } from '../components/NextUpCard';
import * as outbound from '../utils/appointmentOutbound';
import { renderWithProviders } from './testUtils';

const mockNotifyOnTheWay = jest.fn();

jest.mock('../constants/nextUpDesignFlags', () => ({
  NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS: false,
  NEXT_UP_LIFECYCLE_DESIGN_PREVIEW: false,
}));

jest.mock('../../bookings/hooks/useBookingAction', () => ({
  useBookingAction: () => ({
    notifyOnTheWay: mockNotifyOnTheWay,
    startJob: jest.fn(),
    workFinished: jest.fn(),
    runAction: jest.fn(),
    isSending: false,
    disabled: false,
    isOnTheWayDone: () => false,
    isJobStartedDone: () => false,
  }),
}));

jest.spyOn(outbound, 'openMapsForBooking').mockImplementation(() => {});
jest.spyOn(outbound, 'openSmsOnMyWay').mockImplementation(() => Promise.resolve());

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

describe('NextUpCard device outbound mode (SMS not ready)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('always shows On my way and Navigate, even when job is in progress', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        businessName="Sunrise Auto Spa"
        isLoading={false}
        nextBooking={{ ...baseBooking, job_status: 'in_progress' }}
        onMarkComplete={jest.fn()}
        subtitle="Started at 2:00 PM"
        workingPhase="ready"
      />,
    );

    expect(screen.getByLabelText('On my way')).toBeTruthy();
    expect(screen.getByLabelText('Navigate')).toBeTruthy();
    expect(screen.queryByLabelText('Mark complete')).toBeNull();
    expect(screen.queryByLabelText('Start job')).toBeNull();
    expect(screen.queryByLabelText('Done')).toBeNull();
  });

  it('opens Messages with a prefilled on-my-way text and does not call the server action', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        businessName="Sunrise Auto Spa"
        isLoading={false}
        nextBooking={baseBooking}
        subtitle="Today at 2:00 PM"
      />,
    );

    fireEvent.press(screen.getByLabelText('On my way'));

    expect(outbound.openSmsOnMyWay).toHaveBeenCalledWith(baseBooking, {
      businessName: 'Sunrise Auto Spa',
    });
    expect(mockNotifyOnTheWay).not.toHaveBeenCalled();
  });

  it('opens maps when Navigate is pressed', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={baseBooking}
        subtitle="Today at 2:00 PM"
      />,
    );

    fireEvent.press(screen.getByLabelText('Navigate'));
    expect(outbound.openMapsForBooking).toHaveBeenCalledWith(baseBooking);
  });
});

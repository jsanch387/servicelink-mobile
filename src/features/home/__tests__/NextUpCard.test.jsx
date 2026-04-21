import { fireEvent, screen } from '@testing-library/react-native';
import { NextUpCard } from '../components/NextUpCard';
import * as outbound from '../utils/appointmentOutbound';
import { renderWithProviders } from './testUtils';

jest.spyOn(outbound, 'openSmsOnMyWay').mockImplementation(() => {});
jest.spyOn(outbound, 'openMapsForBooking').mockImplementation(() => {});

describe('NextUpCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeleton while loading', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading
        nextBooking={null}
        subtitle=""
        title=""
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
        title=""
      />,
    );
    expect(screen.getByText('No upcoming appointments.')).toBeTruthy();
    expect(screen.getByLabelText('On my way')).toBeDisabled();
    expect(screen.getByLabelText('Navigate')).toBeDisabled();
  });

  it('shows title, subtitle, and enables actions when booking has phone and address', () => {
    const nextBooking = {
      id: '1',
      customer_name: 'Alex',
      service_name: 'Install',
      customer_phone: '5551234567',
      customer_street_address: '1 Main',
      customer_city: 'Austin',
      customer_state: 'TX',
      customer_zip: '78701',
    };
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={nextBooking}
        subtitle="Starts in 30 mins"
        title="Alex — Install"
      />,
    );
    expect(screen.getByText('Alex — Install')).toBeTruthy();
    expect(screen.getByText('Starts in 30 mins')).toBeTruthy();
    expect(screen.getByLabelText('On my way')).not.toBeDisabled();
    expect(screen.getByLabelText('Navigate')).not.toBeDisabled();
  });

  it('invokes SMS and maps helpers when buttons are pressed', () => {
    const nextBooking = {
      id: '1',
      customer_name: 'Alex',
      service_name: 'Install',
      customer_phone: '5551234567',
      customer_street_address: '1 Main',
      customer_city: 'Austin',
      customer_state: 'TX',
      customer_zip: '78701',
    };
    renderWithProviders(
      <NextUpCard
        bookingsError={null}
        businessError={null}
        isLoading={false}
        nextBooking={nextBooking}
        subtitle=""
        title="Alex — Install"
      />,
    );
    fireEvent.press(screen.getByLabelText('On my way'));
    expect(outbound.openSmsOnMyWay).toHaveBeenCalledWith(nextBooking);
    fireEvent.press(screen.getByLabelText('Navigate'));
    expect(outbound.openMapsForBooking).toHaveBeenCalledWith(nextBooking);
  });

  it('shows schedule error from bookings', () => {
    renderWithProviders(
      <NextUpCard
        bookingsError="Bookings failed"
        businessError={null}
        isLoading={false}
        nextBooking={null}
        subtitle=""
        title=""
      />,
    );
    expect(screen.getByText('Bookings failed')).toBeTruthy();
  });
});

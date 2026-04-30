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

  it('shows customer, service, subtitle, and enables actions when booking has phone and address', () => {
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
        subtitle="Today at 2:00 PM"
      />,
    );
    expect(screen.getByText('Alex')).toBeTruthy();
    expect(screen.getByText('Install')).toBeTruthy();
    expect(screen.getByText('Today at 2:00 PM')).toBeTruthy();
    expect(screen.getByLabelText('On my way')).not.toBeDisabled();
    expect(screen.getByLabelText('Navigate')).not.toBeDisabled();
  });

  it('shows tier on the service line and vehicle on the muted line when both exist', () => {
    const nextBooking = {
      id: '2',
      customer_name: 'Jordan Lee',
      service_name: 'Signature Shine — SUV',
      customer_vehicle_year: '2017',
      customer_vehicle_make: 'Toyota',
      customer_vehicle_model: 'Tacoma',
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
        subtitle="Tmrw at 9:00 AM"
      />,
    );
    expect(screen.getByText('Jordan Lee')).toBeTruthy();
    expect(screen.getByText('Signature Shine — SUV')).toBeTruthy();
    expect(screen.getByText('2017 Toyota Tacoma')).toBeTruthy();
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
      />,
    );
    expect(screen.getByText('Bookings failed')).toBeTruthy();
  });
});

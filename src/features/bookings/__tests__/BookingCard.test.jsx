import { fireEvent, screen } from '@testing-library/react-native';
import { BookingCard } from '../components/BookingCard';
import { renderWithProviders } from '../../home/__tests__/testUtils';

jest.mock('../../auth', () => ({
  useAuth: () => ({ user: { id: 'owner-1' } }),
}));

jest.mock('../assignee/hooks/useBookingAssignees', () => ({
  useBookingAssignees: () => ({
    assignees: [],
    canAssign: false,
    pickerOptions: [],
    labelFor: () => null,
    isLoading: false,
  }),
}));

function makeBooking(overrides = {}) {
  return {
    id: 'b1',
    scheduled_date: '2026-04-24',
    start_time: '10:00:00',
    status: 'confirmed',
    service_name: 'Wash',
    customer_name: 'Jane Fuller',
    customer_vehicle_year: '2021',
    customer_vehicle_make: 'Tesla',
    customer_vehicle_model: 'Model 3',
    ...overrides,
  };
}

describe('BookingCard', () => {
  it('calls onPress when card is pressed', () => {
    const onPress = jest.fn();
    renderWithProviders(<BookingCard booking={makeBooking()} onPress={onPress} />);

    fireEvent.press(screen.getByText('Jane Fuller'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows vehicle line when vehicle fields are present', () => {
    renderWithProviders(<BookingCard booking={makeBooking()} />);
    expect(screen.getByText('2021 Tesla Model 3')).toBeTruthy();
  });

  it('shows base service name without pricing option tier', () => {
    renderWithProviders(
      <BookingCard booking={makeBooking({ service_name: 'Signature Shine — SUV' })} />,
    );
    expect(screen.getByText('Signature Shine')).toBeTruthy();
    expect(screen.queryByText('Signature Shine — SUV')).toBeNull();
  });

  it('shows +N more for multi-job appointments', () => {
    renderWithProviders(
      <BookingCard
        booking={makeBooking({
          service_name: 'Signature Shine — SUV',
          visit_job_count: 2,
          job_details: [
            { serviceName: 'Signature Shine', servicePriceOptionLabel: 'SUV' },
            { serviceName: 'Touch-up paint' },
          ],
        })}
      />,
    );
    expect(screen.getByText('Signature Shine +1 more')).toBeTruthy();
  });

  it('omits vehicle line when no vehicle fields', () => {
    renderWithProviders(
      <BookingCard
        booking={makeBooking({
          customer_vehicle_year: null,
          customer_vehicle_make: null,
          customer_vehicle_model: null,
        })}
      />,
    );
    expect(screen.queryByText(/Vehicle not provided/i)).toBeNull();
    expect(screen.queryByText('2021 Tesla Model 3')).toBeNull();
  });

  it('shows the assignee initial and first name from the booking', () => {
    renderWithProviders(
      <BookingCard
        booking={makeBooking({
          assigned_user_id: 'member-1',
          assigned_user_name: 'Jordan Lee',
          shop_can_assign: true,
        })}
      />,
    );
    expect(screen.getByText('J')).toBeTruthy();
    expect(screen.getByText('Jordan')).toBeTruthy();
    expect(screen.queryByText('Jordan Lee')).toBeNull();
  });

  it('shows Myself when the booking is assigned to the signed-in user', () => {
    renderWithProviders(
      <BookingCard
        booking={makeBooking({
          assigned_user_id: 'owner-1',
          assigned_user_name: 'Owner',
          shop_can_assign: true,
        })}
      />,
    );
    expect(screen.getByText('Myself')).toBeTruthy();
  });

  it('hides the assignee on a solo shop', () => {
    renderWithProviders(
      <BookingCard
        booking={makeBooking({
          assigned_user_id: 'owner-1',
          assigned_user_name: 'Owner',
          shop_can_assign: false,
        })}
      />,
    );
    expect(screen.queryByText('Myself')).toBeNull();
    expect(screen.queryByText('Owner')).toBeNull();
  });

  it('hides the assignee when the name is missing', () => {
    renderWithProviders(
      <BookingCard
        booking={makeBooking({
          assigned_user_id: 'member-1',
          shop_can_assign: true,
        })}
      />,
    );
    expect(screen.queryByText('Jordan')).toBeNull();
  });
});

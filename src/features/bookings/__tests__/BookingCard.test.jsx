import { fireEvent, screen } from '@testing-library/react-native';
import { BookingCard } from '../components/BookingCard';
import { renderWithProviders } from '../../home/__tests__/testUtils';

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
});

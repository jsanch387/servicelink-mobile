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
});

import { screen } from '@testing-library/react-native';
import { BookingsCalendarDayAgenda } from '../components/BookingsCalendarDayAgenda';
import { renderWithProviders } from '../../home/__tests__/testUtils';

describe('BookingsCalendarDayAgenda', () => {
  it('shows card skeletons while loading and keeps the date header', () => {
    renderWithProviders(<BookingsCalendarDayAgenda dateKey="2026-05-21" isLoading />);

    expect(screen.getByText(/May 21/)).toBeTruthy();
    expect(screen.queryByText('Nothing scheduled this day.')).toBeNull();
  });

  it('shows empty copy when loaded with no bookings', () => {
    renderWithProviders(<BookingsCalendarDayAgenda bookings={[]} dateKey="2026-05-21" />);

    expect(screen.getByText('Nothing scheduled this day.')).toBeTruthy();
  });
});
